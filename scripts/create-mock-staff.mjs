import { createClient } from "@supabase/supabase-js";
import { existsSync,readFileSync,writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
const root=new URL("../",import.meta.url);
for(const name of ["apps/web/.env.local",".env.admin.local"]) {
 const path=fileURLToPath(new URL(name,root));if(existsSync(path))process.loadEnvFile(path);
}
const secret=process.env.SUPABASE_SECRET_KEY;
if(!secret)throw new Error("Add SUPABASE_SECRET_KEY to .env.admin.local. Never use a NEXT_PUBLIC_ variable.");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(url!=="https://rvawauiwlwtlyfovsiwi.supabase.co")throw new Error("Unexpected project; refusing to create accounts.");
const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:department,error:departmentError}=await client.from("departments").select("id").eq("code","WAT").eq("active",true).single();
if(departmentError)throw new Error("Cannot access Water Services with the supplied administrative key.");
const output=fileURLToPath(new URL(".env.mock-accounts.local",root));
const saved=existsSync(output)?JSON.parse(readFileSync(output,"utf8")):{};
const accounts=[
 {email:"admin.water@civicconnect.test",name:"Mock Administrator",role:"DEPARTMENT_ADMIN"},
 {email:"officer.water@civicconnect.test",name:"Mock Water Officer",role:"OFFICER"}
];
for(const account of accounts){
 let user=null;
 for(let page=1;!user;page++){
  const {data,error}=await client.auth.admin.listUsers({page,perPage:100});
  if(error)throw new Error("Administrative account lookup failed.");
  user=data.users.find(item=>item.email===account.email)||null;
  if(data.users.length<100)break;
 }
 if(user&&!user.app_metadata?.civicconnect_mock)throw new Error("Existing account is not marked as a mock; refusing to modify it.");
 if(!user){
  const password=saved[account.email]?.password||randomBytes(24).toString("base64url");
  saved[account.email]={password,role:account.role};
  writeFileSync(output,JSON.stringify(saved,null,2),{mode:0o600});
  const {data,error}=await client.auth.admin.createUser({email:account.email,password,email_confirm:true,
   user_metadata:{display_name:account.name},app_metadata:{civicconnect_mock:true}});
  if(error)throw new Error("Mock account creation failed: "+error.message);
  user=data.user;
 }
 const {data:profile,error:profileError}=await client.from("profiles").update({role:account.role,department_id:account.role==="DEPARTMENT_ADMIN"?null:department.id})
 .eq("user_id",user.id).select("role,department_id").single();
 if(profileError||profile.role!==account.role)throw new Error("Account exists but role setup failed.");
 saved[account.email]={...saved[account.email],user_id:user.id,role:account.role};
 writeFileSync(output,JSON.stringify(saved,null,2),{mode:0o600});
 console.log(account.email+" configured as "+account.role);
}
console.log("Credentials are saved in the Git-ignored .env.mock-accounts.local file.");
