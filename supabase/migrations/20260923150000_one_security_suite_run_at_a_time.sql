-- One run of the live security suite at a time, wherever it runs.
--
-- The suite in tests/security writes to the real project with one shared test
-- account: specs 08, 20 and 21 promote it to admin for a moment and demote it
-- again. CI already queues its own runs (the concurrency group in ci.yml), but
-- nothing stopped a developer's local run from overlapping the CI run that the
-- same developer's push had just started. On 2026-09-23 that happened twice:
--
--   * 20:48, spec 18 of one run ran while the other run had the account
--     promoted, its "a non-admin cannot save" probe got through, and the live
--     Prompt Coach was left pointing at "attacker/expensive-model";
--   * 21:38, spec 03 of one run wrote role = 'admin' onto the profile while
--     the other run had it promoted, and spec 23 of the first run then failed.
--
-- Neither was a hole in the product. Both were two copies of the suite reading
-- each other's half-finished state. The suite's global setup now takes this
-- single row before it starts (waiting while another run holds it) and gives
-- it back when it ends. A lock older than 20 minutes is treated as abandoned.
--
-- Only the service role reaches the table: no policies, and RLS is on.

CREATE TABLE IF NOT EXISTS public.security_suite_lock (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  holder text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_suite_lock ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.security_suite_lock FROM PUBLIC;
REVOKE ALL ON public.security_suite_lock FROM anon;
REVOKE ALL ON public.security_suite_lock FROM authenticated;

COMMENT ON TABLE public.security_suite_lock IS
  'Held by the running tests/security suite so two runs never share the test account at once. Service role only. 2026-09-23.';
