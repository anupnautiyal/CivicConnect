-- Sprint 0 foundation. Apply only to a development Supabase project first.
begin;
create type public.app_role as enum ('CITIZEN','OFFICER','DEPARTMENT_ADMIN','SYSTEM_ADMIN');
create type public.issue_status as enum ('SUBMITTED','VERIFIED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED','REOPENED');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (length(trim(name)) > 0),
  active boolean not null default true
);
create table public.wards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (length(trim(name)) > 0),
  boundary jsonb,
  active boolean not null default true
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (length(trim(name)) > 0),
  icon text,
  default_department_id uuid references public.departments(id),
  active boolean not null default true
);
create table public.profiles (
  user_id uuid primary key references auth.users(id),
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  role public.app_role not null default 'CITIZEN',
  department_id uuid references public.departments(id),
  active boolean not null default true,
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now(),
  constraint staff_department_required check (role not in ('OFFICER','DEPARTMENT_ADMIN') or department_id is not null)
);
create index profiles_department_idx on public.profiles(department_id);
alter table public.departments enable row level security;
alter table public.wards enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
-- Deliberately deny client access until Sprint 1 adds tested access policies.
revoke all on public.departments, public.wards, public.categories, public.profiles from anon, authenticated;
commit;
begin;
-- Roles are never taken from user-controlled signup metadata.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (new.id, coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'),120),''),'Citizen'), 'CITIZEN');
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill people who signed up before this migration.
insert into public.profiles (user_id, display_name, role)
select id, coalesce(nullif(left(trim(raw_user_meta_data ->> 'display_name'),120),''),'Citizen'), 'CITIZEN'
from auth.users on conflict (user_id) do nothing;

grant select on public.profiles to authenticated;
grant update (display_name, preferences) on public.profiles to authenticated;
create policy profiles_read_own on public.profiles for select to authenticated
using (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
using (user_id = (select auth.uid()) and active)
with check (user_id = (select auth.uid()) and active);

grant select on public.departments, public.wards, public.categories to authenticated;
create policy departments_read_active on public.departments for select to authenticated
using (active and exists (select 1 from public.profiles where user_id = (select auth.uid()) and active));
create policy wards_read_active on public.wards for select to authenticated
using (active and exists (select 1 from public.profiles where user_id = (select auth.uid()) and active));
create policy categories_read_active on public.categories for select to authenticated
using (active and exists (select 1 from public.profiles where user_id = (select auth.uid()) and active));

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated;
create function public.audit_profile_access_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (old.role,old.department_id,old.active) is distinct from (new.role,new.department_id,new.active) then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,safe_metadata)
    values (auth.uid(),'PROFILE_ACCESS_CHANGED','profiles',new.user_id,
      jsonb_build_object('old_role',old.role,'new_role',new.role,
        'old_department_id',old.department_id,'new_department_id',new.department_id,
        'old_active',old.active,'new_active',new.active,'database_actor',session_user));
  end if;
  return new;
end;
$$;
revoke all on function public.audit_profile_access_change() from public, anon, authenticated;
create trigger profile_access_audit after update on public.profiles
for each row execute function public.audit_profile_access_change();
commit;

-- Synthetic local/staging configuration only; no accounts or passwords.
begin;
insert into public.departments (code,name) values
('SAN','Sanitation'),('PWD','Public Works'),('WAT','Water Services'),('ELE','Street Lighting')
on conflict (code) do nothing;
insert into public.wards (code,name) values ('W01','Central'),('W02','Riverside') on conflict (code) do nothing;
insert into public.categories (code,name,default_department_id)
select source.code,source.name,department.id from (values
('SANITATION','Sanitation','SAN'),('ROADS','Roads and footpaths','PWD'),
('WATER','Water and drainage','WAT'),('LIGHTING','Street lighting','ELE')
) as source(code,name,department_code)
join public.departments department on department.code=source.department_code
on conflict (code) do nothing;
commit;
