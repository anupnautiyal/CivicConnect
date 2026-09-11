import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("identity migration enforces ownership, role immutability, deactivation and audit", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
    `);
    for (const file of ["202609110001_foundation.sql","202609110002_identity.sql"]) {
      await db.exec(await readFile(new URL("../../supabase/migrations/" + file, import.meta.url), "utf8"));
    }
    const seed = await readFile(new URL("../../supabase/seed.sql", import.meta.url),"utf8");
    await db.exec(seed); await db.exec(seed);
    await db.exec(`insert into auth.users values
      ('00000000-0000-0000-0000-000000000001','{"display_name":"Citizen One","role":"SYSTEM_ADMIN"}'),
      ('00000000-0000-0000-0000-000000000002','{"display_name":"Citizen Two"}');`);
    assert.equal((await db.query("select role from profiles limit 1")).rows[0].role,"CITIZEN");
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from profiles"), /permission denied/);
    await assert.rejects(db.query("select * from departments"), /permission denied/);
    await db.exec("reset role; set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'");
    assert.equal((await db.query("select * from profiles")).rows.length,1);
    assert.equal((await db.query("select * from departments")).rows.length,4);
    await db.exec("update profiles set display_name = 'Updated citizen'");
    assert.equal((await db.query("select display_name from profiles")).rows[0].display_name,"Updated citizen");
    for (const mutation of [
      "update profiles set role='SYSTEM_ADMIN'",
      "update profiles set active=false",
      "update profiles set department_id=(select id from departments limit 1)",
      "delete from profiles",
      "insert into profiles(user_id,display_name) values ('00000000-0000-0000-0000-000000000003','Fake')",
      "update departments set name='Hijacked'",
      "select * from audit_logs"
    ]) await assert.rejects(db.query(mutation), /permission denied/);
    assert.equal((await db.query("update profiles set display_name='Intrusion' where user_id='00000000-0000-0000-0000-000000000002' returning *")).rows.length,0);
    await db.exec("reset role");
    await assert.rejects(db.query("update profiles set role='OFFICER' where user_id='00000000-0000-0000-0000-000000000001'"), /staff_department_required/);
    await db.exec("update profiles set role='OFFICER', department_id=(select id from departments where code='SAN') where user_id='00000000-0000-0000-0000-000000000001'");
    assert.equal((await db.query("select * from audit_logs")).rows.length,1);
    await db.exec("update profiles set active=false where user_id='00000000-0000-0000-0000-000000000001'; set role authenticated");
    assert.equal((await db.query("select * from departments")).rows.length,0);
    assert.equal((await db.query("update profiles set display_name='Inactive edit' returning *")).rows.length,0);
  } finally { await db.close(); }
});

