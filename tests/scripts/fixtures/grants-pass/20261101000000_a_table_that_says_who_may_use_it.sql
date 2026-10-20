-- A public table, a private table, a view and a serial sequence, each stated.
create table public.widgets (
  id bigserial primary key,
  name text not null
);
alter table public.widgets enable row level security;
grant select on public.widgets to anon;
grant select, insert, update, delete on public.widgets to authenticated;
grant select, insert, update, delete on public.widgets to service_role;
grant usage, select on sequence public.widgets_id_seq to authenticated, service_role;

-- Private on purpose: only SECURITY DEFINER functions read it.
create table if not exists public.widget_secrets (
  id uuid primary key default gen_random_uuid(),
  secret text
);
revoke all on public.widget_secrets from anon, authenticated;

-- Identity columns need no sequence grant.
create table public.widget_events (
  id bigint generated always as identity primary key,
  widget_id bigint references public.widgets (id)
);
grant select, insert on public.widget_events to authenticated, service_role;

create view public.widget_names with (security_invoker = on) as
  select id, name from public.widgets;
grant select on public.widget_names to anon, authenticated;

-- A table made inside a function body is not judged here.
create function public.make_scratch() returns void language plpgsql as $$
begin
  create table public.scratch (x int);
end $$;
