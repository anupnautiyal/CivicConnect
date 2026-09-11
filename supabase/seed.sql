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
