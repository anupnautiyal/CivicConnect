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

