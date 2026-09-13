import { createClient } from "../../../../../lib/supabase/server";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
 const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return new Response("Sign in required",{status:401,headers});
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response("Not found",{status:404,headers});
 // Both metadata and bytes use the requesting citizen's RLS-protected session.
 const {data:media,error}=await supabase.from("issue_media").select("storage_path").eq("issue_id",id).eq("purpose","REPORT").limit(1).maybeSingle();
 if(error)return new Response("Photo temporarily unavailable",{status:503,headers});
 if(!media)return new Response("Not found",{status:404,headers});
 const {data,error:downloadError}=await supabase.storage.from("issue-photos").download(media.storage_path);
 if(downloadError||!data)return new Response("Photo unavailable",{status:404,headers});
 return new Response(data,{headers:{...headers,"Content-Type":data.type||"image/jpeg"}});
}

