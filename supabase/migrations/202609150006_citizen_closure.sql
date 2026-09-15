begin;
create table public.closure_settings(singleton boolean primary key default true check(singleton),reopen_days integer not null default 14 check(reopen_days between 1 and 90));
insert into public.closure_settings values(true,14);
alter table public.closure_settings enable row level security;
revoke all on public.closure_settings from anon,authenticated;
create table public.feedback(id uuid primary key default gen_random_uuid(),issue_id uuid not null unique references public.issues(id),citizen_id uuid not null references public.profiles(user_id),rating integer not null check(rating between 1 and 5),comment text not null default '' check(length(comment)<=2000),created_at timestamptz not null default now());
alter table public.feedback enable row level security;
revoke all on public.feedback from anon,authenticated;
grant select on public.feedback to authenticated;
create policy feedback_read on public.feedback for select to authenticated using(exists(select 1 from public.issues where id=issue_id));
create table public.notifications(id uuid primary key default gen_random_uuid(),recipient_id uuid not null references public.profiles(user_id),issue_id uuid not null references public.issues(id),history_id uuid not null unique references public.status_history(id),event_type text not null,created_at timestamptz not null default now(),read_at timestamptz);
create index notifications_recipient on public.notifications(recipient_id,created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using(recipient_id=auth.uid() and public.active_citizen());
create function public.notify_citizen() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(recipient_id,issue_id,history_id,event_type) select reporter_id,new.issue_id,new.id,new.to_status::text from public.issues where id=new.issue_id on conflict(history_id) do nothing;
 return new;
end;$$;
revoke all on function public.notify_citizen() from public,anon,authenticated;
create trigger notify_status after insert on public.status_history for each row execute function public.notify_citizen();
create function public.mark_notification_read(p_id uuid) returns void language sql security definer set search_path='' as $$
 update public.notifications set read_at=coalesce(read_at,now()) where id=p_id and recipient_id=auth.uid() and public.active_citizen();
$$;
revoke all on function public.mark_notification_read(uuid) from public,anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
create function public.citizen_closure(p_issue uuid,p_request uuid,p_operation text,p_note text default '',p_rating integer default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_issue public.issues%rowtype; v_receipt public.workflow_requests%rowtype; v_resolved timestamptz; v_days integer; v_next public.issue_status;
begin
 if not public.active_citizen() then raise exception 'Active citizen account required'; end if;
 if p_request is null then raise exception 'Request identifier required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
 select * into v_issue from public.issues where id=p_issue and reporter_id=auth.uid() for update;
 if not found then raise exception 'Report not available'; end if;
 select * into v_receipt from public.workflow_requests where actor_id=auth.uid() and request_id=p_request;
 if found then
 if v_receipt.issue_id<>p_issue or v_receipt.operation<>p_operation then raise exception 'Request key already used'; end if;
 return p_issue;
 end if;
 if length(coalesce(p_note,''))>2000 then raise exception 'Comment is too long'; end if;
 if p_operation='RATE' then
 if v_issue.status<>'CLOSED' then raise exception 'Confirm closure before rating'; end if;
 if p_rating is null or p_rating not between 1 and 5 then raise exception 'Choose a rating from 1 to 5'; end if;
 insert into public.feedback(issue_id,citizen_id,rating,comment) values(p_issue,auth.uid(),p_rating,trim(coalesce(p_note,'')));
 else
 if v_issue.status<>'RESOLVED' then raise exception 'Only resolved reports can be confirmed or reopened'; end if;
 if p_operation='CONFIRM' then v_next:='CLOSED';
 elsif p_operation='REOPEN' then
 if length(trim(coalesce(p_note,'')))<10 then raise exception 'Explain the remaining problem in at least 10 characters'; end if;
 select max(created_at) into v_resolved from public.status_history where issue_id=p_issue and to_status='RESOLVED';
 select reopen_days into v_days from public.closure_settings where singleton;
 if v_resolved is null or now()>v_resolved+make_interval(days=>v_days) then raise exception 'The reopening window has ended'; end if;
 v_next:='REOPENED';
 else raise exception 'Unknown citizen operation'; end if;
 update public.issues set status=v_next where id=p_issue;
 insert into public.status_history(issue_id,from_status,to_status,changed_by,note) values(p_issue,v_issue.status,v_next,auth.uid(),case when p_operation='CONFIRM' then 'Citizen confirmed the resolution.' else trim(p_note) end);
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,safe_metadata) values(auth.uid(),'CITIZEN_'||p_operation,'issues',p_issue,jsonb_build_object('request_id',p_request));
 insert into public.workflow_requests(actor_id,request_id,issue_id,operation) values(auth.uid(),p_request,p_issue,p_operation);
 return p_issue;
end;$$;
revoke all on function public.citizen_closure(uuid,uuid,text,text,integer) from public,anon;
grant execute on function public.citizen_closure(uuid,uuid,text,text,integer) to authenticated;
commit;
