-- The browser roles lose TRUNCATE, REFERENCES, TRIGGER and MAINTAIN on public
-- (2026-09-30 audit; noted as a wart by the 2026-08-20 audit).
--
-- What was wrong. Supabase's default privileges hand anon and authenticated
-- every table privilege in public (arwdDxtm), so both roles hold, on 53 of the
-- 54 tables (all but security_suite_lock) and on the one view:
--   TRUNCATE    empties a table, and row-level security does not apply to it
--   REFERENCES  lets the holder create a foreign key onto the table
--   TRIGGER     lets the holder attach a trigger to it
--   MAINTAIN    VACUUM, ANALYZE, REINDEX, CLUSTER, LOCK TABLE (Postgres 17)
-- PostgREST offers no verb for any of these, so none is reachable today with
-- the anon key or a user's session. They are live the moment any path runs
-- SQL as those roles: a SECURITY INVOKER function with dynamic SQL, an
-- extension that exposes one, a future endpoint. TRUNCATE in particular
-- ignores every policy this repository has written.
--
-- How it was measured. has_table_privilege() on production: all four held by
-- both roles on every relation in public, and pg_default_acl for postgres in
-- public grants them to every table created from now on. Every reader was
-- checked: the app and the edge functions use SELECT, INSERT, UPDATE and
-- DELETE through PostgREST; pg_graphql is not installed; the edge functions,
-- cron and migrations run as service_role or postgres, which keep everything.
--
-- What it changes. The four privileges are revoked from anon and
-- authenticated on every table and view in public, and from the default
-- privileges postgres hands out for new tables there. SELECT, INSERT, UPDATE
-- and DELETE, and every column grant, are untouched. Tables that
-- supabase_admin creates in public keep Supabase's defaults; migrations never
-- run as that role.

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM anon, authenticated;
