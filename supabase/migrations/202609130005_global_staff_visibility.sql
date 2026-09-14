begin;
-- The existing DEPARTMENT_ADMIN enum value now represents a general administrator.
-- Keep stored role values compatible with current accounts and clients.
alter table public.profiles drop constraint staff_department_required;
alter table public.profiles add constraint staff_department_required
 check (role <> 'OFFICER' or department_id is not null);

create or replace function public.staff_can_access(p_issue uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join public.issues i on i.id=p_issue
 where p.user_id=auth.uid() and p.active and p.role in ('OFFICER','DEPARTMENT_ADMIN','SYSTEM_ADMIN'));
$$;

create or replace function public.staff_can_manage(p_issue uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join public.issues i on i.id=p_issue
 where p.user_id=auth.uid() and p.active and (
 p.role in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') or
 (p.role='OFFICER' and p.department_id=i.department_id and exists(
 select 1 from public.assignments a where a.issue_id=i.id and a.officer_id=p.user_id and a.ended_at is null))));
$$;
revoke all on function public.staff_can_manage(uuid) from public,anon;
grant execute on function public.staff_can_manage(uuid) to authenticated;

drop policy staff_resolution_upload on storage.objects;
create policy staff_resolution_upload on storage.objects for insert to authenticated with check(
 bucket_id='issue-photos' and split_part(name,'/',1)=auth.uid()::text and split_part(name,'/',2)='resolutions'
 and exists(select 1 from public.issues i where i.id::text=split_part(name,'/',3)
 and public.staff_can_manage(i.id) and i.status in ('IN_PROGRESS','REOPENED')));
create or replace function public.assignable_officers(p_issue uuid)
returns table(user_id uuid,display_name text,department_name text)
language plpgsql stable security definer set search_path='' as $$
declare v_role public.app_role; v_department uuid;
begin
 if not public.staff_can_access(p_issue) then raise exception 'Not authorized'; end if;
 select role into v_role from public.profiles where profiles.user_id=auth.uid();
 if v_role not in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') then raise exception 'Administrator required'; end if;
 select department_id into v_department from public.issues where id=p_issue;
 return query select p.user_id,p.display_name,d.name from public.profiles p join public.departments d on d.id=p.department_id
 where p.active and p.role='OFFICER' and d.active and
 (p.department_id=v_department or (v_role in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') and v_department is null))
 order by p.display_name;
end; $$;
revoke all on function public.assignable_officers(uuid) from public,anon;
grant execute on function public.assignable_officers(uuid) to authenticated;


create or replace function public.staff_workflow(p_issue uuid,p_request uuid,p_expected public.issue_status,
 p_operation text,p_note text default '',p_officer uuid default null,p_photo text default null,p_visibility text default 'CITIZEN')
returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_profile public.profiles%rowtype;
 v_issue public.issues%rowtype;
 v_next public.issue_status;
 v_officer public.profiles%rowtype;
 v_receipt public.workflow_requests%rowtype;
 v_note text:=trim(coalesce(p_note,''));
begin
 select * into v_profile from public.profiles where user_id=auth.uid();
 if not found or not v_profile.active or v_profile.role='CITIZEN' then raise exception 'Active staff account required'; end if;
 if not public.staff_can_manage(p_issue) then raise exception 'Not authorized for this report'; end if;
 -- A request key and row lock serialize retries and competing updates.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
 select * into v_receipt from public.workflow_requests where actor_id=auth.uid() and request_id=p_request;
 if found then
  if v_receipt.issue_id<>p_issue or v_receipt.operation<>p_operation then raise exception 'Request key already used'; end if;
  return p_issue;
 end if;
 select * into v_issue from public.issues where id=p_issue for update;
 -- Recheck after locking: another administrator may have reassigned this issue.
 if not public.staff_can_manage(p_issue) then raise exception 'Not authorized for this report'; end if;
 if v_issue.status is distinct from p_expected then raise exception 'Report changed; refresh before trying again'; end if;
 if length(v_note)>2000 then raise exception 'Note is too long'; end if;
 v_next:=v_issue.status;

 case p_operation
 when 'VERIFY' then
  if v_profile.role not in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') or v_issue.status<>'SUBMITTED' then raise exception 'Cannot verify this report'; end if;
  v_next:='VERIFIED';
 when 'REJECT' then
  if v_profile.role not in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') or v_issue.status not in ('SUBMITTED','VERIFIED') then raise exception 'Cannot reject this report'; end if;
  if v_note='' then raise exception 'Rejection reason required'; end if;
  v_next:='REJECTED';
 when 'ASSIGN' then
  if v_profile.role not in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') or v_issue.status<>'VERIFIED' then raise exception 'Cannot assign this report'; end if;
  select * into v_officer from public.profiles where user_id=p_officer and active and role='OFFICER' for share;
  if not found then raise exception 'Select an active officer'; end if;
  if not exists(select 1 from public.departments where id=v_officer.department_id and active) then raise exception 'Officer department inactive'; end if;
  if v_issue.department_id is not null and v_officer.department_id<>v_issue.department_id then raise exception 'Officer belongs to another department'; end if;

  insert into public.assignments(issue_id,officer_id,assigned_by) values(p_issue,p_officer,auth.uid());
  if v_issue.department_id is null then update public.issues set department_id=v_officer.department_id where id=p_issue; end if;
  v_next:='ASSIGNED';
 when 'UNASSIGN' then
  if v_profile.role not in ('DEPARTMENT_ADMIN','SYSTEM_ADMIN') or v_issue.status<>'ASSIGNED' then raise exception 'Cannot return this report to triage'; end if;
  if v_note='' then raise exception 'Reassignment reason required'; end if;
  update public.assignments set ended_at=now() where issue_id=p_issue and ended_at is null;
  v_next:='VERIFIED';
 when 'START' then
  if v_issue.status not in ('ASSIGNED','REOPENED') then raise exception 'Cannot start work at this stage'; end if;
  v_next:='IN_PROGRESS';
 when 'RESOLVE' then
  if v_issue.status not in ('IN_PROGRESS','REOPENED') then raise exception 'Cannot resolve at this stage'; end if;
  if v_note='' then raise exception 'Resolution note required'; end if;
  if p_photo is distinct from auth.uid()::text||'/resolutions/'||p_issue::text||'/'||p_request::text||'.jpg' then raise exception 'Resolution photo required'; end if;
  if not exists(select 1 from storage.objects where bucket_id='issue-photos' and name=p_photo) then raise exception 'Upload resolution photo first'; end if;
  insert into public.issue_media(issue_id,storage_path,purpose,uploaded_by) values(p_issue,p_photo,'RESOLUTION',auth.uid());
  v_next:='RESOLVED';
 when 'NOTE' then
  if v_issue.status in ('CLOSED','REJECTED') then raise exception 'Report is no longer open for notes'; end if;
  if v_note='' or p_visibility is null or p_visibility not in ('CITIZEN','STAFF') then raise exception 'Note and valid visibility required'; end if;
  insert into public.comments(issue_id,author_id,author_name,body,visibility)
  values(p_issue,auth.uid(),v_profile.display_name,v_note,p_visibility);
 else raise exception 'Unknown workflow operation';
 end case;
 if v_next<>v_issue.status then
  update public.issues set status=v_next where id=p_issue;
  insert into public.status_history(issue_id,from_status,to_status,changed_by,note)
  values(p_issue,v_issue.status,v_next,auth.uid(),nullif(v_note,''));
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,safe_metadata)
 values(auth.uid(),'STAFF_'||p_operation,'issues',p_issue,jsonb_build_object(
 'from_status',v_issue.status,'to_status',v_next,'officer_id',p_officer,'visibility',p_visibility,'request_id',p_request));
 insert into public.workflow_requests(actor_id,request_id,issue_id,operation) values(auth.uid(),p_request,p_issue,p_operation);
 return p_issue;
end; $$;
revoke all on function public.staff_workflow(uuid,uuid,public.issue_status,text,text,uuid,text,text) from public,anon;
grant execute on function public.staff_workflow(uuid,uuid,public.issue_status,text,text,uuid,text,text) to authenticated;
-- General administrators no longer need a department affiliation.
update public.profiles set department_id=null where role='DEPARTMENT_ADMIN' and department_id is not null;
commit;
