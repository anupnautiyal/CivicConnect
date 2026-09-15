begin;
create table public.staff_access_requests(user_id uuid primary key references public.profiles(user_id),requested_role public.app_role not null check(requested_role in ('DEPARTMENT_ADMIN','OFFICER')),organisation text not null check(length(organisation) between 1 and 160),employee_id text not null check(length(employee_id) between 1 and 80),status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED')),created_at timestamptz not null default now(),reviewed_at timestamptz,verification_reference text);
alter table public.staff_access_requests enable row level security;
revoke all on public.staff_access_requests from public,anon,authenticated;
grant select(user_id,requested_role,organisation,status,created_at,reviewed_at) on public.staff_access_requests to authenticated;
create policy own_staff_request on public.staff_access_requests for select to authenticated using(user_id=auth.uid());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(user_id,display_name,role) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),120),''),'Citizen'),'CITIZEN');
 if new.raw_user_meta_data->>'requested_role' in ('DEPARTMENT_ADMIN','OFFICER') then
 insert into public.staff_access_requests(user_id,requested_role,organisation,employee_id) values(new.id,(new.raw_user_meta_data->>'requested_role')::public.app_role,left(coalesce(nullif(trim(new.raw_user_meta_data->>'organisation'),''),'Not supplied'),160),left(coalesce(nullif(trim(new.raw_user_meta_data->>'employee_id'),''),'Not supplied'),80));
 end if;
 return new;
end;$$;
create function public.review_staff_access(p_user uuid,p_approve boolean,p_reference text,p_department uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare r public.staff_access_requests%rowtype;
begin
 if length(trim(coalesce(p_reference,'')))<12 then raise exception 'Document the independent employment verification'; end if;
 select * into r from public.staff_access_requests where user_id=p_user for update;
 if not found or r.status<>'PENDING' then raise exception 'Pending request required'; end if;
 if p_approve then
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'Verified email required'; end if;
 if not exists(select 1 from public.profiles where user_id=p_user and active and role='CITIZEN') then raise exception 'Active citizen account required'; end if;
 if r.requested_role='OFFICER' and not exists(select 1 from public.departments where id=p_department and active) then raise exception 'Active officer department required'; end if;
 update public.profiles set role=r.requested_role,department_id=case when r.requested_role='OFFICER' then p_department else null end where user_id=p_user;
 end if;
 update public.staff_access_requests set status=case when p_approve then 'APPROVED' else 'REJECTED' end,reviewed_at=now(),verification_reference=trim(p_reference) where user_id=p_user;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,safe_metadata) values(auth.uid(),'STAFF_ACCESS_REVIEWED','profiles',p_user,jsonb_build_object('approved',p_approve,'requested_role',r.requested_role,'database_actor',session_user));
end;$$;
revoke all on function public.review_staff_access(uuid,boolean,text,uuid) from public,anon,authenticated;
grant execute on function public.review_staff_access(uuid,boolean,text,uuid) to service_role;
commit;
