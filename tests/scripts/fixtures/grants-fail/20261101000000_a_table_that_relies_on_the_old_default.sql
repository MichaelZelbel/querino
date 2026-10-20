create table public.gadgets (
  id serial primary key,
  name text
);
alter table public.gadgets enable row level security;
grant select, insert on public.gadgets to authenticated;

-- Nothing about who may read this one.
create materialized view public.gadget_counts as select count(*) from public.gadgets;
