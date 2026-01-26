-- =====================================================
-- AI Usage Tracking Schema
-- Credits-based UX with token-based ledger underneath
-- =====================================================

-- Table 1: ai_allowance_periods
-- One row per user per allowance/billing period
CREATE TABLE public.ai_allowance_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    
    -- Credits allowance (what user sees)
    credits_granted numeric(18,6) NOT NULL DEFAULT 0,
    credits_used numeric(18,6) NOT NULL DEFAULT 0,
    credits_unit text NOT NULL DEFAULT 'credit',
    
    -- Internal unit (for accurate decrement on small calls)
    milli_credits_granted bigint NOT NULL DEFAULT 0,
    milli_credits_used bigint NOT NULL DEFAULT 0,
    
    -- Token allowance (optional, for later configuration)
    tokens_granted bigint NOT NULL DEFAULT 0,
    tokens_used bigint NOT NULL DEFAULT 0,
    
    -- Conversion configuration for this period
    token_to_milli_credit_factor numeric(18,6) NOT NULL DEFAULT 0,
    
    -- Metadata
    source text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT ai_allowance_periods_user_period_unique UNIQUE (user_id, period_start, period_end),
    CONSTRAINT ai_allowance_periods_credits_non_negative CHECK (credits_granted >= 0 AND credits_used >= 0),
    CONSTRAINT ai_allowance_periods_milli_credits_non_negative CHECK (milli_credits_granted >= 0 AND milli_credits_used >= 0),
    CONSTRAINT ai_allowance_periods_tokens_non_negative CHECK (tokens_granted >= 0 AND tokens_used >= 0)
);

-- Index for efficient lookup of current period
CREATE INDEX idx_ai_allowance_periods_user_period_end ON public.ai_allowance_periods (user_id, period_end DESC);

-- Table 2: llm_usage_events
-- Append-only ledger of every LLM call
CREATE TABLE public.llm_usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Idempotency fields
    idempotency_key text NOT NULL,
    n8n_execution_id text NULL,
    workflow_id text NULL,
    workflow_name text NULL,
    feature text NULL,
    provider text NULL,
    model text NULL,
    
    -- Token usage
    prompt_tokens bigint NOT NULL DEFAULT 0,
    completion_tokens bigint NOT NULL DEFAULT 0,
    total_tokens bigint NOT NULL DEFAULT 0,
    
    -- Credits charged
    milli_credits_charged bigint NOT NULL DEFAULT 0,
    credits_charged numeric(18,6) NOT NULL DEFAULT 0,
    
    -- Metadata
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT llm_usage_events_tokens_non_negative CHECK (prompt_tokens >= 0 AND completion_tokens >= 0 AND total_tokens >= 0),
    CONSTRAINT llm_usage_events_credits_non_negative CHECK (milli_credits_charged >= 0 AND credits_charged >= 0),
    CONSTRAINT llm_usage_events_user_idempotency_unique UNIQUE (user_id, idempotency_key)
);

-- Index for usage history lookup
CREATE INDEX idx_llm_usage_events_user_created_at ON public.llm_usage_events (user_id, created_at DESC);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE public.ai_allowance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_usage_events ENABLE ROW LEVEL SECURITY;

-- ai_allowance_periods: Users can only SELECT their own rows
CREATE POLICY "Users can view their own allowance periods"
ON public.ai_allowance_periods
FOR SELECT
USING (auth.uid() = user_id);

-- llm_usage_events: Users can only SELECT their own rows
CREATE POLICY "Users can view their own usage events"
ON public.llm_usage_events
FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- View: v_ai_allowance_current
-- Convenience view for current period with calculated fields
-- =====================================================

CREATE OR REPLACE VIEW public.v_ai_allowance_current
WITH (security_invoker = on)
AS
SELECT
    aap.id,
    aap.user_id,
    aap.period_start,
    aap.period_end,
    aap.credits_granted,
    aap.credits_used,
    aap.credits_unit,
    aap.milli_credits_granted,
    aap.milli_credits_used,
    aap.tokens_granted,
    aap.tokens_used,
    aap.token_to_milli_credit_factor,
    aap.source,
    aap.metadata,
    aap.created_at,
    aap.updated_at,
    -- Calculated fields
    GREATEST(aap.milli_credits_granted - aap.milli_credits_used, 0) AS remaining_milli_credits,
    (GREATEST(aap.milli_credits_granted - aap.milli_credits_used, 0)::numeric / 1000.0)::numeric(18,6) AS remaining_credits,
    GREATEST(aap.tokens_granted - aap.tokens_used, 0) AS remaining_tokens,
    FLOOR(GREATEST(aap.milli_credits_granted - aap.milli_credits_used, 0) / 1000.0)::bigint AS display_credits
FROM public.ai_allowance_periods aap
WHERE aap.period_end >= now()
  AND aap.period_start <= now()
  AND aap.id = (
      SELECT id
      FROM public.ai_allowance_periods
      WHERE user_id = aap.user_id
        AND period_end >= now()
        AND period_start <= now()
      ORDER BY period_end DESC
      LIMIT 1
  );

-- =====================================================
-- Triggers
-- =====================================================

-- Trigger: Update updated_at on ai_allowance_periods
CREATE TRIGGER update_ai_allowance_periods_updated_at
BEFORE UPDATE ON public.ai_allowance_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function: Set total_tokens on llm_usage_events insert
CREATE OR REPLACE FUNCTION public.set_llm_usage_total_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.total_tokens = 0 AND (NEW.prompt_tokens > 0 OR NEW.completion_tokens > 0) THEN
        NEW.total_tokens = NEW.prompt_tokens + NEW.completion_tokens;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger: Auto-calculate total_tokens on insert
CREATE TRIGGER set_llm_usage_events_total_tokens
BEFORE INSERT ON public.llm_usage_events
FOR EACH ROW
EXECUTE FUNCTION public.set_llm_usage_total_tokens();