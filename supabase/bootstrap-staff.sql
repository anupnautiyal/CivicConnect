-- Staff test-account setup for the existing development project.
-- Fill in the TWO verified account emails below; keep the citizen account separate.
-- WAT = Water Services; SAN = Sanitation; PWD = Public Works; ELE = Street Lighting.
-- Blank/unverified/mismatched accounts abort the whole transaction.
begin;
do $$
declare
 admin_email text := '';
 officer_email text := '';
 department_code text := 'WAT';
 department_uuid uuid;
 admin_uuid uuid;
 officer_uuid uuid;
begin
 if trim(admin_email)='' or trim(officer_email)='' then
  raise exception 'Fill in both verified staff-account emails before running this script';
 end if;
 if lower(trim(admin_email))=lower(trim(officer_email)) then
  raise exception 'Use separate accounts for administrator and officer';
 end if;
 select id into strict department_uuid from public.departments where code=department_code and active;
 select id into strict admin_uuid from auth.users
 where lower(email)=lower(trim(admin_email)) and email_confirmed_at is not null;
 select id into strict officer_uuid from auth.users
 where lower(email)=lower(trim(officer_email)) and email_confirmed_at is not null;
 perform 1 from public.profiles where user_id in (admin_uuid,officer_uuid) order by user_id for update;
 if not exists(select 1 from public.profiles where user_id=admin_uuid and active and
  (role='CITIZEN' or (role='DEPARTMENT_ADMIN' and department_id=department_uuid)))
 then raise exception 'Administrator profile is missing, inactive, or already has a different staff role/department'; end if;
 if not exists(select 1 from public.profiles where user_id=officer_uuid and active and
  (role='CITIZEN' or (role='OFFICER' and department_id=department_uuid)))
 then raise exception 'Officer profile is missing, inactive, or already has a different staff role/department'; end if;
 update public.profiles set role='DEPARTMENT_ADMIN',department_id=department_uuid where user_id=admin_uuid;
 update public.profiles set role='OFFICER',department_id=department_uuid where user_id=officer_uuid;
 raise notice 'Both staff accounts configured successfully';
end;
$$;
commit;
