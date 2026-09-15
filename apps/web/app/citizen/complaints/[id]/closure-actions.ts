"use server";
import {revalidatePath} from "next/cache";
import {requireProfile} from "../../../../lib/auth";
import {createClient} from "../../../../lib/supabase/server";
export async function closeReport(_previous:{message:string},form:FormData){
 await requireProfile("CITIZEN");
 const id=String(form.get("issue")||"");
 const request=String(form.get("request")||"");
 const operation=String(form.get("operation")||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f-]{36}$/i.test(request)||!["CONFIRM","REOPEN","RATE"].includes(operation))return {message:"Invalid request. Refresh and try again."};
 const client=await createClient();
 const {error}=await client.rpc("citizen_closure",{p_issue:id,p_request:request,p_operation:operation,p_note:String(form.get("note")||""),p_rating:operation==="RATE"?Number(form.get("rating")):null});
 if(error)return {message:error.code==="P0001"?error.message:"Could not save your response. Refresh and try again."};
 revalidatePath("/citizen");revalidatePath("/citizen/complaints/"+id);revalidatePath("/admin");revalidatePath("/officer");revalidatePath("/staff/issues/"+id);
 return {message:"Your response has been saved."};
}
