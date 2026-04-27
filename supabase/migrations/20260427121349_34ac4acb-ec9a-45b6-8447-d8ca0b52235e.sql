-- Long-lived MCP/API Personal Access Tokens
-- Stores only a SHA-256 hash of the raw token. Raw token is shown to user once.

CREATE TABLE IF NOT EXISTS public.mcp_api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mcp_api_tokens_user_id ON public.mcp_api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_api_tokens_token_hash ON public.mcp_api_tokens(token_hash);

ALTER TABLE public.mcp_api_tokens ENABLE ROW LEVEL SECURITY;

-- Users can list/manage only their own tokens. token_hash is fine to expose to the owner
-- since they already know the raw token, and it cannot be reversed.
CREATE POLICY "Users can view their own MCP tokens"
  ON public.mcp_api_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own MCP tokens"
  ON public.mcp_api_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only revoked_at on their own tokens (used for revocation)
CREATE POLICY "Users can update their own MCP tokens"
  ON public.mcp_api_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MCP tokens"
  ON public.mcp_api_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Security definer function used by the MCP edge function (with service role) to
-- look up a token by its SHA-256 hash and return the owning user_id if valid.
-- Updates last_used_at on success.
CREATE OR REPLACE FUNCTION public.lookup_mcp_token(p_token_hash text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT id, user_id, revoked_at, expires_at
    INTO v_record
    FROM public.mcp_api_tokens
   WHERE token_hash = p_token_hash
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_record.revoked_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  IF v_record.expires_at IS NOT NULL AND v_record.expires_at < now() THEN
    RETURN NULL;
  END IF;

  -- Best-effort touch; do not fail auth if this update raises
  BEGIN
    UPDATE public.mcp_api_tokens
       SET last_used_at = now()
     WHERE id = v_record.id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_record.user_id;
END;
$$;

-- Make the lookup callable from the service role (used by edge function)
REVOKE ALL ON FUNCTION public.lookup_mcp_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_mcp_token(text) TO service_role;