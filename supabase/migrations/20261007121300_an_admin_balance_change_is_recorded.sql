-- An admin's change to someone's AI credit balance is applied and recorded in
-- one step (2026-10-07 review).
--
-- What was wrong. The admin panels changed ai_allowance_periods from the
-- browser and then inserted an audit row into llm_usage_events
-- (src/components/admin/adjustAllowance.ts). That table has a SELECT policy
-- and nothing else, so the insert was always refused: the balance changed,
-- the toast said "audit log failed", and no change was ever recorded. And had
-- it worked, the row would have sat in the usage ledger with the net grant as
-- its total_tokens, counted as if it were AI usage.
--
-- How it was measured. 0 rows with feature 'admin_balance_adjustment' in
-- production; the policy list on llm_usage_events read live.
--
-- What it changes. admin_adjust_allowance() checks the caller is an admin,
-- locks the period, applies the change as a delta on the row as it is now
-- (what adjustAllowance.ts did with a compare-and-retry loop), and writes the
-- record into admin_allowance_adjustments in the same transaction, so a
-- change without a record cannot happen. Only admins can read the records.
-- Deleting an account keeps them without the person, like the usage ledger
-- (CLAUDE.md, "Deleting an account: one rule").

CREATE TABLE IF NOT EXISTS public.admin_allowance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allowance_period_id uuid REFERENCES public.ai_allowance_periods(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  via text NOT NULL CHECK (via IN ('token_modal', 'inline_balance')),
  previous_tokens_granted bigint NOT NULL,
  new_tokens_granted bigint NOT NULL,
  previous_tokens_used bigint NOT NULL,
  new_tokens_used bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_allowance_adjustments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_allowance_adjustments FROM anon, authenticated;
GRANT SELECT ON public.admin_allowance_adjustments TO authenticated;

DROP POLICY IF EXISTS "Admins read balance adjustments" ON public.admin_allowance_adjustments;
CREATE POLICY "Admins read balance adjustments"
  ON public.admin_allowance_adjustments
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_admin_allowance_adjustments_user_id
  ON public.admin_allowance_adjustments (user_id);

CREATE OR REPLACE FUNCTION public.admin_adjust_allowance(
  p_allowance_id uuid,
  p_granted_delta bigint,
  p_used_delta bigint,
  p_via text
)
RETURNS TABLE (
  previous_tokens_granted bigint,
  previous_tokens_used bigint,
  new_tokens_granted bigint,
  new_tokens_used bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_admin uuid := auth.uid();
  v_user uuid;
  v_prev_granted bigint;
  v_prev_used bigint;
  v_granted bigint;
  v_used bigint;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'Only an admin can change a balance'
      USING ERRCODE = '42501';
  END IF;
  IF p_via IS NULL OR p_via NOT IN ('token_modal', 'inline_balance') THEN
    RAISE EXCEPTION 'Unknown admin control %', p_via
      USING ERRCODE = '22023';
  END IF;

  SELECT a.user_id, a.tokens_granted, a.tokens_used
    INTO v_user, v_prev_granted, v_prev_used
    FROM public.ai_allowance_periods a
   WHERE a.id = p_allowance_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The allowance period no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;

  v_granted := greatest(coalesce(v_prev_granted, 0) + coalesce(p_granted_delta, 0), 0);
  v_used := coalesce(v_prev_used, 0) + coalesce(p_used_delta, 0);
  IF v_used < 0 THEN
    -- More remaining than the period grants: grant the difference.
    v_granted := v_granted - v_used;
    v_used := 0;
  END IF;

  UPDATE public.ai_allowance_periods
     SET tokens_granted = v_granted, tokens_used = v_used
   WHERE id = p_allowance_id;

  INSERT INTO public.admin_allowance_adjustments
    (allowance_period_id, user_id, admin_id, via,
     previous_tokens_granted, new_tokens_granted,
     previous_tokens_used, new_tokens_used)
  VALUES
    (p_allowance_id, v_user, v_admin, p_via,
     coalesce(v_prev_granted, 0), v_granted,
     coalesce(v_prev_used, 0), v_used);

  RETURN QUERY SELECT coalesce(v_prev_granted, 0), coalesce(v_prev_used, 0), v_granted, v_used;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_adjust_allowance(uuid, bigint, bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_adjust_allowance(uuid, bigint, bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_allowance(uuid, bigint, bigint, text) TO authenticated;
