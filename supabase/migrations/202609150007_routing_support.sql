begin;
create table public.routing_rules(id uuid primary key default gen_random_uuid(),category_id uuid not null references public.categories(id),ward_id uuid references public.wards(id),department_id uuid not null references public.departments(id),active boolean not null default true);
create unique index routing_rule_scope on public.routing_rules(category_id,coalesce(ward_id,'00000000-0000-0000-0000-000000000000'::uuid));
alter table public.routing_rules enable row level security;
revoke all on public.routing_rules from anon,authenticated;
insert into public.routing_rules(category_id,department_id) select id,default_department_id from public.categories where default_department_id is not null;
create function public.route_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 select r.department_id into new.department_id from public.routing_rules r join public.departments d on d.id=r.department_id and d.active where r.active and r.category_id=new.category_id and (r.ward_id=new.ward_id or r.ward_id is null) order by (r.ward_id is not null) desc limit 1;
 return new;
end;$$;
revoke all on function public.route_report() from public,anon,authenticated;
create trigger route_new_report before insert on public.issues for each row execute function public.route_report();
create table public.issue_support(issue_id uuid not null references public.issues(id),citizen_id uuid not null references public.profiles(user_id),created_at timestamptz not null default now(),primary key(issue_id,citizen_id));
alter table public.issue_support enable row level security;
revoke all on public.issue_support from anon,authenticated;
create function public.nearby_reports(p_category uuid,p_lat double precision,p_lng double precision) returns table(id uuid,reference_no bigint,status public.issue_status,distance_m integer,support_count bigint,supported boolean) language plpgsql stable security definer set search_path='' as $$
begin
 if not public.active_citizen() then raise exception 'Active citizen account required'; end if;
 if p_lat is null or p_lng is null or not(p_lat between -90 and 90) or not(p_lng between -180 and 180) then raise exception 'Valid coordinates required'; end if;
 return query select i.id,i.reference_no,i.status,round(x.m)::integer,(select count(*) from public.issue_support s where s.issue_id=i.id),exists(select 1 from public.issue_support s where s.issue_id=i.id and s.citizen_id=auth.uid())
 from public.issues i cross join lateral(select 6371000*2*asin(sqrt(least(1.0,power(sin(radians(i.lat-p_lat)/2),2)+cos(radians(p_lat))*cos(radians(i.lat))*power(sin(radians(i.lng-p_lng)/2),2)))) as m) x
 where i.category_id=p_category and i.status not in ('CLOSED','REJECTED') and i.created_at>now()-interval '90 days' and x.m<=500 order by x.m,i.id limit 10;
end;$$;
revoke all on function public.nearby_reports(uuid,double precision,double precision) from public,anon;
grant execute on function public.nearby_reports(uuid,double precision,double precision) to authenticated;
create function public.support_report(p_issue uuid,p_category uuid,p_lat double precision,p_lng double precision) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.nearby_reports(p_category,p_lat,p_lng) n where n.id=p_issue) then raise exception 'This report is no longer available nearby'; end if;
 if exists(select 1 from public.issues where id=p_issue and reporter_id=auth.uid()) then raise exception 'You already own this report'; end if;
 insert into public.issue_support(issue_id,citizen_id) values(p_issue,auth.uid()) on conflict do nothing;
end;$$;
revoke all on function public.support_report(uuid,uuid,double precision,double precision) from public,anon;
grant execute on function public.support_report(uuid,uuid,double precision,double precision) to authenticated;
commit;
