-- Before the cutoff: relied on the automatic grant. Reported, never failed.
create table public.legacy_things (id uuid primary key default gen_random_uuid());
