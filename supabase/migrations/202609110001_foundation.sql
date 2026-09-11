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
