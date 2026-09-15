import {createClient} from "../../../../lib/supabase/server";
export async function GET(){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 const headers={"Cache-Control":"private, no-store"};
 if(!user)return Response.json({error:"Sign in required"},{status:401,headers});
 const {count,error}=await client.from("notifications").select("id",{count:"exact",head:true}).eq("recipient_id",user.id).is("read_at",null);
 return error?Response.json({error:"Unavailable"},{status:503,headers}):Response.json({count:count??0},{headers});
}
