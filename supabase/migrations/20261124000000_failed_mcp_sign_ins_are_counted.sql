-- Failed MCP sign-ins are counted per caller address, so the MCP server can
-- answer an address with 20 failures in 10 minutes 429 unless its token is
-- valid (issue #42, open since the 2026-09-30 audit). The limit and the
-- window are in supabase/functions/_shared/mcpAuthLimit.ts; the window rule
-- lives here, in record_mcp_auth_failure, so concurrent failures count once
-- each.
--
-- A row holds a keyed hash of the address (HMAC, never the address), a count
-- and when the count started. Nothing else. A window is over after 10
-- minutes; the hourly job below deletes rows whose window started more than
-- an hour ago, so no row outlives two hours.

create table public.mcp_auth_failures (
  address_hash text primary key,
  failures integer not null,
  window_started_at timestamptz not null default now()
);

alter table public.mcp_auth_failures enable row level security;

-- Only the MCP server, on the service role key, reads or writes it.
revoke all on public.mcp_auth_failures from anon, authenticated;
grant select, insert, update, delete on public.mcp_auth_failures to service_role;

-- One failure for the address. A window that started p_window_seconds or more
-- ago starts again at one. Runs as its caller (the service role), which holds
-- the table grants above.
create or replace function public.record_mcp_auth_failure(
  p_address_hash text,
  p_window_seconds integer
)
returns void
language sql
set search_path = public
as $$
  insert into public.mcp_auth_failures as f (address_hash, failures, window_started_at)
  values (p_address_hash, 1, now())
  on conflict (address_hash) do update set
    failures = case
      when f.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else f.failures + 1
    end,
    window_started_at = case
      when f.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else f.window_started_at
    end;
$$;

revoke all on function public.record_mcp_auth_failure(text, integer) from public, anon, authenticated;
grant execute on function public.record_mcp_auth_failure(text, integer) to service_role;

-- cron.schedule() replaces a job of the same name, so running this again
-- changes nothing. Minute 41 stays clear of the even-minute tickers and the
-- other hourly job (minute 17).
select cron.schedule(
  'prune-mcp-auth-failures',
  '41 * * * *',
  $$delete from public.mcp_auth_failures where window_started_at < now() - interval '1 hour'$$
);
