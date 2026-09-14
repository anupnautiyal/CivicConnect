import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("municipal lifecycle enforces department, assignment, evidence, privacy and replay rules",async()=>{
 const db=new PGlite();
 try{
 await db.exec(`
 create role anon; create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as
 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text unique);
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 grant select,insert,update,delete on storage.objects to authenticated;
 `);
 for(const file of ["202609110001_foundation.sql","202609110002_identity.sql","202609110003_reporting.sql","202609130004_municipal_workflow.sql"])
 await db.exec(await readFile(new URL("../../supabase/migrations/"+file,import.meta.url),"utf8"));
 await db.exec(await readFile(new URL("../../supabase/seed.sql",import.meta.url),"utf8"));
 const uid=n=>"00000000-0000-0000-0000-"+String(n).padStart(12,"0");
 const citizen=uid(1),officer=uid(2),admin=uid(3),foreignAdmin=uid(4),foreignOfficer=uid(5),otherCitizen=uid(6),system=uid(7);
 for(let n=1;n<=7;n++)await db.query("insert into auth.users(id,raw_user_meta_data) values($1,$2)",[uid(n),{display_name:"Test account "+n}]);
 const san=(await db.query("select id from departments where code='SAN'")).rows[0].id;
 const wat=(await db.query("select id from departments where code='WAT'")).rows[0].id;
 for(const [user,role,department] of [[officer,"OFFICER",san],[admin,"DEPARTMENT_ADMIN",san],[foreignAdmin,"DEPARTMENT_ADMIN",wat],[foreignOfficer,"OFFICER",wat],[system,"SYSTEM_ADMIN",null]])
 await db.query("update profiles set role=$1,department_id=$2 where user_id=$3",[role,department,user]);
 const category=(await db.query("select id from categories where code='SANITATION'")).rows[0].id;
 async function as(user){await db.exec("reset role;set role authenticated");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);}
 const issue="10000000-0000-0000-0000-000000000001";
 async function create(id){await as(citizen);const path=citizen+"/"+id+"/report.jpg";
 await db.query("insert into storage.objects(bucket_id,name) values('issue-photos',$1)",[path]);
 await db.query("select submit_issue($1,'Overflowing bin','Waste covers the public footpath',$2,30.2,78.1,null,'Market Road landmark',$3)",[id,category,path]);}
 await create(issue);
 let sequence=0;
 const key=()=> "20000000-0000-0000-0000-"+String(++sequence).padStart(12,"0");
 async function act(operation,expected,note="",assigned=null,photo=null,request=key(),visibility="CITIZEN",id=issue){
 return db.query("select staff_workflow($1,$2,$3,$4,$5,$6,$7,$8)",[id,request,expected,operation,note,assigned,photo,visibility]);}
 await assert.rejects(act("VERIFY","SUBMITTED"),/Active staff/);
 await as(foreignAdmin);
 assert.equal((await db.query("select * from issues")).rows.length,0);
 await assert.rejects(act("VERIFY","SUBMITTED"),/Not authorized/);
 await as(officer);
 assert.equal((await db.query("select * from issues")).rows.length,0);
 await assert.rejects(act("START","SUBMITTED"),/Not authorized/);
 await as(admin);
 assert.equal((await db.query("select * from issues")).rows.length,1);
 assert.equal((await db.query("select * from assignable_officers($1)",[issue])).rows.length,1);
 await assert.rejects(act("REJECT","SUBMITTED"),/reason required/);
 await act("VERIFY","SUBMITTED","Issue verified");
 await assert.rejects(act("ASSIGN","SUBMITTED","",officer),/Report changed/);
 await assert.rejects(act("ASSIGN","VERIFIED","",foreignOfficer),/another department/);
 await act("ASSIGN","VERIFIED","",officer);
 await as(officer);
 assert.equal((await db.query("select * from issues")).rows.length,1);
 await assert.rejects(act("REJECT","ASSIGNED","invalid"),/Cannot reject/);
 await act("NOTE","ASSIGNED","Internal scheduling detail",null,null,key(),"STAFF");
 await act("NOTE","ASSIGNED","Team will visit today",null,null,key(),"CITIZEN");
 await as(citizen);
 assert.equal((await db.query("select * from comments")).rows.length,1);
 assert.equal((await db.query("select * from assignments")).rows.length,0);
 await as(officer);
 await act("START","ASSIGNED");
 await assert.rejects(act("RESOLVE","IN_PROGRESS"),/note required/);
 await assert.rejects(act("RESOLVE","IN_PROGRESS","Cleaned site"),/photo required/);
 const resolveKey=key(),photo=officer+"/resolutions/"+issue+"/"+resolveKey+".jpg";
 await db.query("insert into storage.objects(bucket_id,name) values('issue-photos',$1)",[photo]);
 await act("RESOLVE","IN_PROGRESS","Cleaned site",null,photo,resolveKey);
 await act("RESOLVE","IN_PROGRESS","Cleaned site",null,photo,resolveKey);
 assert.equal((await db.query("select * from status_history")).rows.length,5);
 assert.equal((await db.query("select * from issue_media where purpose='RESOLUTION'")).rows.length,1);
 await assert.rejects(act("START","RESOLVED"),/Cannot start/);
 for(const table of ["issues","status_history","assignments","comments","workflow_requests"])
 await assert.rejects(db.query("delete from "+table),/permission denied/);
 await as(citizen);
 assert.equal((await db.query("select * from issue_media")).rows.length,2);
 assert.equal((await db.query("select * from storage.objects")).rows.length,2);
 assert.equal((await db.query("select actor_name from status_history where to_status='RESOLVED'")).rows[0].actor_name,"Test account 2");
 await as(otherCitizen);
 for(const table of ["issues","issue_media","status_history","comments","storage.objects"])
 assert.equal((await db.query("select * from "+table)).rows.length,0,table);
 // After loss of assignment/department access, attached evidence still cannot be deleted.
 await db.exec("reset role");
 await db.query("update profiles set department_id=$1 where user_id=$2",[wat,officer]);
 await as(officer);
 assert.equal((await db.query("delete from storage.objects where name=$1 returning *",[photo])).rows.length,0);
 await db.exec("reset role");await db.query("update profiles set department_id=$1 where user_id=$2",[san,officer]);
 // Reassignment ends access immediately and obeys the explicit ASSIGNED -> VERIFIED path.
 const second="10000000-0000-0000-0000-000000000002";
 await create(second);await as(admin);
 await act("VERIFY","SUBMITTED","",null,null,key(),"CITIZEN",second);
 await act("ASSIGN","VERIFIED","",officer,null,key(),"CITIZEN",second);
 await assert.rejects(act("UNASSIGN","ASSIGNED","",null,null,key(),"CITIZEN",second),/reason required/);
 await act("UNASSIGN","ASSIGNED","Officer unavailable",null,null,key(),"CITIZEN",second);
 await as(officer);
 assert.equal((await db.query("select * from issues where id=$1",[second])).rows.length,0);
 await as(admin);
 await act("REJECT","VERIFIED","Outside municipal scope",null,null,key(),"CITIZEN",second);
 await db.exec("reset role");await db.query("update profiles set active=false where user_id=$1",[admin]);await as(admin);
 assert.equal((await db.query("select * from issues")).rows.length,0);
 await assert.rejects(act("NOTE","RESOLVED","Try"),/Active staff/);
 await db.exec("reset role;set role anon");
 await assert.rejects(act("VERIFY","SUBMITTED"),/permission denied/);
 }finally{await db.close();}
});
