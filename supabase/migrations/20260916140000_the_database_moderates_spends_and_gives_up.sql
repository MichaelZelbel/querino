-- The three larger findings the 2026-09-16 audit left open (godspeed decision D-214).
--
-- 1. MODERATION NO LONGER DEPENDS ON THE CLIENT ASKING FOR IT.
--
--    The only way into moderation_review_queue was the moderate-content edge
--    function, which the browser calls before it saves, and whose client
--    helper fails open. Anyone with a REST client could PATCH is_public or
--    published through PostgREST and never be reviewed. The queue row is now
--    written by the database whenever an artifact becomes public, or changes
--    its text while public, whoever made the write. The worker already reads
--    the live artifact, so the snapshot here is only a record.
--
--    One pending row per item: the client path and the trigger both file one,
--    and a partial unique index makes the second a no-op instead of a second
--    paid classification.
--
-- 2. THE CREDIT GATE RESERVES BEFORE IT SPENDS.
--
--    assertCredits only asked whether a user had more than zero tokens left,
--    so one token bought twenty parallel calls at the input caps. llm.ts now
--    reserves an estimate with reserve_llm_credits before calling the
--    provider; the UPDATE only matches while the estimate still fits, so
--    concurrent calls queue on the row lock and the ones that no longer fit
--    are refused. record_llm_usage settles the difference against the
--    reservation it is handed, and release_llm_credits hands a reservation
--    back when the provider call failed.
--
-- 3. AN ARTIFACT THAT CANNOT BE EMBEDDED STOPS BEING TRIED.
--
--    backfill-embeddings reclaimed a row that could never embed every two
--    minutes, for ever. Migration 20260908120600 added embedding_failed_at for
--    this, but the function never wrote it. Rows now carry an attempt count
--    and the last error; the job stops at five, and an edit to the text starts
--    the count again.

-- ---------------------------------------------------------------------------
-- 1. Moderation on publish
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS moderation_review_queue_one_pending_per_item
  ON public.moderation_review_queue (item_type, item_id)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.enqueue_moderation_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item_type  text;
  v_now_public boolean;
  v_was_public boolean := false;
BEGIN
  -- prompts spells the flag is_public, the other three published. PL/pgSQL
  -- resolves NEW.<column> only when the branch runs, so one function serves
  -- all four tables.
  IF TG_TABLE_NAME = 'prompts' THEN
    v_item_type  := 'prompt';
    v_now_public := coalesce(NEW.is_public, false);
    IF TG_OP = 'UPDATE' THEN v_was_public := coalesce(OLD.is_public, false); END IF;
  ELSE
    v_item_type := CASE TG_TABLE_NAME
                     WHEN 'skills'      THEN 'skill'
                     WHEN 'workflows'   THEN 'workflow'
                     WHEN 'prompt_kits' THEN 'prompt_kit'
                   END;
    v_now_public := coalesce(NEW.published, false);
    IF TG_OP = 'UPDATE' THEN v_was_public := coalesce(OLD.published, false); END IF;
  END IF;

  -- Nothing public, nothing to review. An artifact with no author cannot be
  -- enforced by the worker (it strikes the author), and the queue row needs
  -- a user.
  IF v_item_type IS NULL OR NOT v_now_public OR NEW.author_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Already public and the text did not change: a rating, a sync stamp or an
  -- embedding landing is not new content.
  IF TG_OP = 'UPDATE' AND v_was_public
     AND NEW.title       IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.content     IS NOT DISTINCT FROM OLD.content THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.moderation_review_queue
    (item_type, item_id, user_id, content_snapshot, status)
  VALUES
    (v_item_type, NEW.id, NEW.author_id,
     left(concat_ws(E'\n\n', NEW.title, NEW.description, NEW.content), 5000),
     'pending')
  ON CONFLICT (item_type, item_id) WHERE status = 'pending' DO NOTHING;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_moderation_on_publish() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enqueue_moderation_on_publish ON public.prompts;
CREATE TRIGGER enqueue_moderation_on_publish
  AFTER INSERT OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_moderation_on_publish();

DROP TRIGGER IF EXISTS enqueue_moderation_on_publish ON public.skills;
CREATE TRIGGER enqueue_moderation_on_publish
  AFTER INSERT OR UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_moderation_on_publish();

DROP TRIGGER IF EXISTS enqueue_moderation_on_publish ON public.workflows;
CREATE TRIGGER enqueue_moderation_on_publish
  AFTER INSERT OR UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_moderation_on_publish();

DROP TRIGGER IF EXISTS enqueue_moderation_on_publish ON public.prompt_kits;
CREATE TRIGGER enqueue_moderation_on_publish
  AFTER INSERT OR UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_moderation_on_publish();

-- ---------------------------------------------------------------------------
-- 2. Reserve, then settle
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_llm_credits(p_user_id uuid, p_tokens bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL OR p_tokens IS NULL OR p_tokens <= 0 THEN
    RETURN true;
  END IF;

  -- The WHERE on the remaining balance is re-checked against the committed
  -- row by a concurrent UPDATE that waited on the lock (READ COMMITTED), so
  -- two calls cannot both take the last reservation.
  UPDATE public.ai_allowance_periods ap
     SET tokens_used = coalesce(ap.tokens_used, 0) + p_tokens,
         updated_at  = now()
   WHERE ap.id = (
           SELECT c.id FROM public.ai_allowance_periods c
            WHERE c.user_id = p_user_id
              AND c.period_start <= now() AND c.period_end > now()
            ORDER BY c.period_end DESC
            LIMIT 1)
     AND ap.tokens_granted - coalesce(ap.tokens_used, 0) >= p_tokens
  RETURNING ap.id INTO v_id;

  RETURN v_id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_llm_credits(p_user_id uuid, p_tokens bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL OR p_tokens IS NULL OR p_tokens <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.ai_allowance_periods
     SET tokens_used = greatest(0, coalesce(tokens_used, 0) - p_tokens),
         updated_at  = now()
   WHERE user_id = p_user_id
     AND now() >= period_start
     AND now() <  period_end;
END;
$$;

-- record_llm_usage gains p_reserved_tokens. A new argument is a new overload
-- in Postgres, so the old signature goes rather than sitting beside it.
DROP FUNCTION IF EXISTS public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb);

CREATE FUNCTION public.record_llm_usage(
  p_user_id uuid,
  p_idempotency_key text,
  p_feature text,
  p_provider text,
  p_model text,
  p_prompt_tokens bigint,
  p_completion_tokens bigint,
  p_total_tokens bigint,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_reserved_tokens bigint DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tokens_per_credit int;
  v_credits_charged numeric;
  v_row_count int := 0;
  v_total bigint;
  v_reserved bigint := greatest(coalesce(p_reserved_tokens, 0), 0);
BEGIN
  v_total := coalesce(p_total_tokens, 0);
  IF v_total = 0 THEN
    v_total := coalesce(p_prompt_tokens, 0) + coalesce(p_completion_tokens, 0);
  END IF;

  v_tokens_per_credit := public.tokens_per_credit();
  v_credits_charged := v_total::numeric / v_tokens_per_credit::numeric;

  INSERT INTO public.llm_usage_events (
    user_id, idempotency_key, feature, provider, model,
    prompt_tokens, completion_tokens, total_tokens,
    credits_charged, metadata
  ) VALUES (
    p_user_id, p_idempotency_key, p_feature, p_provider, p_model,
    coalesce(p_prompt_tokens, 0), coalesce(p_completion_tokens, 0), v_total,
    v_credits_charged, coalesce(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  -- First arrival: charge the real total less what was already reserved.
  -- A repeat charges nothing, but still hands its own reservation back,
  -- because the reservation was taken for this attempt and not the first.
  IF v_row_count > 0 OR v_reserved > 0 THEN
    UPDATE public.ai_allowance_periods
       SET tokens_used = greatest(0, coalesce(tokens_used, 0)
                                     + CASE WHEN v_row_count > 0 THEN v_total ELSE 0 END
                                     - v_reserved),
           updated_at = now()
     WHERE user_id = p_user_id
       AND now() >= period_start
       AND now() <  period_end;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_llm_credits(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_llm_credits(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_llm_credits(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_llm_credits(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb, bigint) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Embedding attempts
-- ---------------------------------------------------------------------------

ALTER TABLE public.prompts     ADD COLUMN IF NOT EXISTS embedding_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.skills      ADD COLUMN IF NOT EXISTS embedding_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.workflows   ADD COLUMN IF NOT EXISTS embedding_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.prompt_kits ADD COLUMN IF NOT EXISTS embedding_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.prompts     ADD COLUMN IF NOT EXISTS embedding_error text;
ALTER TABLE public.skills      ADD COLUMN IF NOT EXISTS embedding_error text;
ALTER TABLE public.workflows   ADD COLUMN IF NOT EXISTS embedding_error text;
ALTER TABLE public.prompt_kits ADD COLUMN IF NOT EXISTS embedding_error text;

CREATE OR REPLACE FUNCTION public.clear_embedding_on_text_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.title       IS DISTINCT FROM OLD.title
  OR NEW.description IS DISTINCT FROM OLD.description
  OR NEW.content     IS DISTINCT FROM OLD.content THEN
    NEW.embedding := NULL;
    NEW.embedding_failed_at := NULL;
    NEW.embedding_attempts := 0;
    NEW.embedding_error := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_embedding(p_item_type text, p_item_id uuid, p_embedding vector)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_item_type = 'prompt' THEN
    UPDATE prompts SET embedding = p_embedding, embedding_attempts = 0, embedding_error = NULL, embedding_failed_at = NULL WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    UPDATE skills SET embedding = p_embedding, embedding_attempts = 0, embedding_error = NULL, embedding_failed_at = NULL WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    UPDATE workflows SET embedding = p_embedding, embedding_attempts = 0, embedding_error = NULL, embedding_failed_at = NULL WHERE id = p_item_id;
  ELSIF p_item_type = 'prompt_kit' THEN
    UPDATE prompt_kits SET embedding = p_embedding, embedding_attempts = 0, embedding_error = NULL, embedding_failed_at = NULL WHERE id = p_item_id;
  ELSE
    RAISE EXCEPTION 'Unknown item_type: %', p_item_type;
  END IF;
END;
$$;

-- p_counts: false for a failure that is not the row's fault (a provider out
-- of credit, a timeout). Those are recorded but do not use up an attempt, or
-- one outage would retire every row in the backlog for good.
CREATE OR REPLACE FUNCTION public.record_embedding_failure(
  p_item_type text, p_item_id uuid, p_error text, p_counts boolean DEFAULT true)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_table text := CASE p_item_type
                    WHEN 'prompt'     THEN 'prompts'
                    WHEN 'skill'      THEN 'skills'
                    WHEN 'workflow'   THEN 'workflows'
                    WHEN 'prompt_kit' THEN 'prompt_kits'
                  END;
  v_attempts integer;
BEGIN
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Unknown item_type: %', p_item_type;
  END IF;
  EXECUTE format(
    'UPDATE public.%I
        SET embedding_attempts = embedding_attempts + CASE WHEN $3 THEN 1 ELSE 0 END,
            embedding_error = left($2, 500),
            embedding_failed_at = now()
      WHERE id = $1
      RETURNING embedding_attempts', v_table)
    INTO v_attempts
    USING p_item_id, p_error, p_counts;
  RETURN v_attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.record_embedding_failure(text, uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_embedding_failure(text, uuid, text, boolean) TO service_role;
