begin;
create table public.issues (
 id uuid primary key,
 reference_no bigint generated always as identity unique,
 reporter_id uuid not null references public.profiles(user_id),
 title text not null check (length(trim(title)) between 5 and 120),
 description text not null check (length(trim(description)) between 15 and 2000),
 category_id uuid not null references public.categories(id),
 ward_id uuid references public.wards(id),
 department_id uuid references public.departments(id),
 status public.issue_status not null default 'SUBMITTED',
 priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH')),
 lat double precision not null check (lat between -90 and 90),
 lng double precision not null check (lng between -180 and 180),
 accuracy double precision check (accuracy >= 0 and accuracy < 100000),
 address text not null check (length(trim(address)) between 5 and 300),
 created_at timestamptz not null default now()
);
create index issues_reporter_created_idx on public.issues(reporter_id,created_at desc);
create index issues_department_status_idx on public.issues(department_id,status);
create table public.issue_media (
 id uuid primary key default gen_random_uuid(),
 issue_id uuid not null references public.issues(id),
 storage_path text not null unique,
 media_type text not null default 'image/jpeg',
 purpose text not null default 'REPORT' check (purpose in ('REPORT','RESOLUTION')),
 uploaded_by uuid not null references public.profiles(user_id),
 created_at timestamptz not null default now()
);
create index issue_media_issue_idx on public.issue_media(issue_id);
create table public.status_history (
 id uuid primary key default gen_random_uuid(),
 issue_id uuid not null references public.issues(id),
 from_status public.issue_status,
 to_status public.issue_status not null,
 changed_by uuid not null references public.profiles(user_id),
 note text,
 created_at timestamptz not null default now()
);
create index status_history_issue_idx on public.status_history(issue_id,created_at);
alter table public.issues enable row level security;
alter table public.issue_media enable row level security;
alter table public.status_history enable row level security;
revoke all on public.issues,public.issue_media,public.status_history from anon,authenticated;
grant select on public.issues,public.issue_media,public.status_history to authenticated;

create function public.active_citizen() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where user_id=auth.uid() and active and role='CITIZEN');
$$;
revoke all on function public.active_citizen() from public,anon;
grant execute on function public.active_citizen() to authenticated;
create policy own_issues on public.issues for select to authenticated
 using (reporter_id=auth.uid() and public.active_citizen());
create policy own_media on public.issue_media for select to authenticated
 using (exists(select 1 from public.issues where id=issue_id));
create policy own_history on public.status_history for select to authenticated
 using (exists(select 1 from public.issues where id=issue_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('issue-photos','issue-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy report_photo_upload on storage.objects for insert to authenticated
 with check (bucket_id='issue-photos' and split_part(name,'/',1)=auth.uid()::text and public.active_citizen());
create policy report_photo_read on storage.objects for select to authenticated
 using (bucket_id='issue-photos' and split_part(name,'/',1)=auth.uid()::text and public.active_citizen());
-- Only unattached uploads can be removed. Submitted evidence is immutable to clients.
create policy report_photo_cleanup on storage.objects for delete to authenticated
 using (bucket_id='issue-photos' and split_part(name,'/',1)=auth.uid()::text
 and public.active_citizen() and not exists(select 1 from public.issue_media where storage_path=name));

create function public.submit_issue(
 p_id uuid,p_title text,p_description text,p_category uuid,
 p_lat double precision,p_lng double precision,p_accuracy double precision,p_address text,p_photo text
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := auth.uid();
 v_department uuid;
 v_existing uuid;
begin
 if not public.active_citizen() then raise exception 'Active citizen account required'; end if;
 -- Serializes identical retry keys without coupling unrelated submissions.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select id into v_existing from public.issues where id=p_id and reporter_id=v_user;
 if found then return v_existing; end if;
 if exists(select 1 from public.issues where id=p_id) then raise exception 'Invalid report identifier'; end if;
 select d.id into v_department from public.categories c
 left join public.departments d on d.id=c.default_department_id and d.active
 where c.id=p_category and c.active;
 if not found then raise exception 'Select an active category'; end if;
 if p_photo is distinct from v_user::text || '/' || p_id::text || '/report.jpg'
 then raise exception 'Invalid photo path'; end if;
 -- The app normalizes image bytes before uploading. Storage existence is checked transactionally.
 if not exists(select 1 from storage.objects where bucket_id='issue-photos' and name=p_photo)
 then raise exception 'Upload a report photograph first'; end if;
 insert into public.issues(id,reporter_id,title,description,category_id,department_id,lat,lng,accuracy,address)
 values(p_id,v_user,trim(p_title),trim(p_description),p_category,v_department,p_lat,p_lng,p_accuracy,trim(p_address));
 insert into public.issue_media(issue_id,storage_path,uploaded_by) values(p_id,p_photo,v_user);
 insert into public.status_history(issue_id,to_status,changed_by,note)
 values(p_id,'SUBMITTED',v_user,'Report submitted by citizen.');
 insert into public.audit_logs(actor_id,action,entity_type,entity_id)
 values(v_user,'ISSUE_SUBMITTED','issues',p_id);
 return p_id;
end;
$$;
revoke all on function public.submit_issue(uuid,text,text,uuid,double precision,double precision,double precision,text,text) from public,anon;
grant execute on function public.submit_issue(uuid,text,text,uuid,double precision,double precision,double precision,text,text) to authenticated;
commit;
