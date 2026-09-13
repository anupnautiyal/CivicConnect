import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("reports, history and private photos enforce ownership and retry safety",async()=>{
 const db=new PGlite();
 try {
 await db.exec(`
 create role anon; create role authenticated;
 create schema auth; create schema storage;
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
 for(const file of ["202609110001_foundation.sql","202609110002_identity.sql","202609110003_reporting.sql"])
 await db.exec(await readFile(new URL("../../supabase/migrations/"+file,import.meta.url),"utf8"));
 await db.exec(await readFile(new URL("../../supabase/seed.sql",import.meta.url),"utf8"));
 const user="00000000-0000-0000-0000-000000000001",other="00000000-0000-0000-0000-000000000002";
 const id="10000000-0000-0000-0000-000000000001";
 await db.exec(`insert into auth.users(id) values ('${user}'),('${other}')`);
 const category=(await db.query("select id from categories where code='SANITATION'")).rows[0].id;
 await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}'`);
 const path=user+"/"+id+"/report.jpg";
 const call=(reportId=id,title="Overflowing bin",lat=30.2,photo=path)=>db.query(
 "select public.submit_issue($1,$2,$3,$4,$5,$6,$7,$8,$9) as id",
 [reportId,title,"Waste is blocking the community footpath.",category,lat,78.1,10,"Market Road, near community centre",photo]);
 await assert.rejects(call(),/Upload a report photograph first/);
 await db.query("insert into storage.objects(bucket_id,name) values ('issue-photos',$1)",[path]);
 await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('issue-photos',$1)",[other+"/forbidden.jpg"]),/row-level security/);
 await assert.rejects(call(id,"Bad"),/check constraint/);
 assert.equal((await db.query("select * from issues")).rows.length,0);
 assert.equal((await db.query("select * from status_history")).rows.length,0);
 await assert.rejects(call(id,"Overflowing bin",91),/check constraint/);
 await assert.rejects(call(id,"Overflowing bin",30.2,other+"/photo.jpg"),/Invalid photo path/);
 assert.equal((await call()).rows[0].id,id);
 assert.equal((await call()).rows[0].id,id);
 assert.equal((await db.query("select * from issues")).rows.length,1);
 assert.equal((await db.query("select * from status_history")).rows.length,1);
 assert.equal((await db.query("select * from issue_media")).rows.length,1);
 for(const table of ["issues","issue_media","status_history"]) {
 await assert.rejects(db.query("delete from "+table),/permission denied/);
 }
 await assert.rejects(db.query("update issues set status='CLOSED'"),/permission denied/);
 assert.equal((await db.query("delete from storage.objects returning *")).rows.length,0);
 assert.equal((await db.query("update storage.objects set name='changed' returning *")).rows.length,0);
 await db.exec(`set request.jwt.claim.sub='${other}'`);
 for(const table of ["issues","issue_media","status_history","storage.objects"])
 assert.equal((await db.query("select * from "+table)).rows.length,0,table);
 await assert.rejects(call(),/Invalid report identifier/);
 await db.exec("reset role");
 await db.query("update profiles set active=false where user_id=$1",[user]);
 await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}'`);
 assert.equal((await db.query("select * from issues")).rows.length,0);
 await assert.rejects(call(),/Active citizen account required/);
 await db.exec("reset role; set role anon");
 await assert.rejects(db.query("select * from issues"),/permission denied/);
 await assert.rejects(call(),/permission denied/);
 }finally{await db.close();}
});
