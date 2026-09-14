"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { statuses } from "@civicconnect/domain";
import { requireStaff } from "../../../../lib/staff-auth";
import { createClient } from "../../../../lib/supabase/server";
import { normalizeReportPhoto,MAX_PHOTO_BYTES } from "../../../../lib/report-photo";
const schema=z.object({issue:z.string().uuid(),request:z.string().uuid(),expected:z.enum(statuses),
 operation:z.enum(["VERIFY","REJECT","ASSIGN","UNASSIGN","START","RESOLVE","NOTE"]),
 note:z.string().trim().max(2000),officer:z.string().uuid().nullable(),visibility:z.enum(["CITIZEN","STAFF"])});
export type WorkflowResult={error?:string;success?:boolean};
export async function applyWorkflow(form:FormData):Promise<WorkflowResult>{
 const {user}=await requireStaff();
 const parsed=schema.safeParse({issue:form.get("issue"),request:form.get("request"),expected:form.get("expected"),operation:form.get("operation"),
 note:form.get("note")||"",officer:form.get("officer")||null,visibility:form.get("visibility")||"CITIZEN"});
 if(!parsed.success)return {error:"Check the form values before submitting."};
 const input=parsed.data;
 if(["REJECT","UNASSIGN","RESOLVE","NOTE"].includes(input.operation)&&!input.note)return {error:"Please provide a note or reason."};
 const supabase=await createClient();
 // RLS is checked before processing any uploaded bytes.
 const {data:issue,error:issueError}=await supabase.from("issues").select("id").eq("id",input.issue).maybeSingle();
 if(issueError||!issue)return {error:"This report is unavailable or outside your access."};
 let photoPath:string|null=null;
 if(input.operation==="RESOLVE"){
  const photo=form.get("photo");
  if(!(photo instanceof File)||!photo.size||photo.size>MAX_PHOTO_BYTES||!["image/jpeg","image/png","image/webp"].includes(photo.type))
   return {error:"Choose a resolution photo (JPEG, PNG or WebP), up to 5 MB."};
  let bytes:Buffer;
  try{bytes=await normalizeReportPhoto(Buffer.from(await photo.arrayBuffer()));}catch{return {error:"The resolution photo is not a supported, readable image."};}
  photoPath=user.id+"/resolutions/"+input.issue+"/"+input.request+".jpg";
  const {data:attached}=await supabase.from("issue_media").select("id").eq("issue_id",input.issue).eq("storage_path",photoPath).maybeSingle();
  const {error}=attached?{error:null}:await supabase.storage.from("issue-photos").upload(photoPath,bytes,{contentType:"image/jpeg",upsert:false});
  if(error&&String(error.statusCode)!=="409")return {error:"Resolution photo upload failed. Your form is preserved; try again."};
 }
 try{
 const {error}=await supabase.rpc("staff_workflow",{p_issue:input.issue,p_request:input.request,p_expected:input.expected,
 p_operation:input.operation,p_note:input.note,p_officer:input.officer,p_photo:photoPath,p_visibility:input.visibility});
 if(error){
  if(photoPath)await supabase.storage.from("issue-photos").remove([photoPath]);
  return {error:error.code==="P0001"?error.message:"The change could not be saved. Refresh to check the latest status before retrying."};
 }
 }catch{return {error:"Connection interrupted. Refresh to check whether the change was saved, or retry this form."};}
 for(const path of ["/officer","/department","/admin","/staff/issues/"+input.issue,"/citizen","/citizen/complaints/"+input.issue])revalidatePath(path);
 return {success:true};
}
