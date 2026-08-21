-- Finding H3, part one of two: a way to read a GitHub token that does not
-- depend on it being in the table in plain text.
--
-- Nothing is encrypted yet and nothing is taken away. This migration only adds
-- the column the ciphertext will live in and the function that will read it,
-- and that function still falls back to the plaintext column, so every caller
-- keeps working exactly as it does today.
--
-- The order matters and it is the lesson Phase 0 paid for: the fix and the
-- callers of the fix cannot ship in the same step. Part one adds the reader,
-- the edge functions are deployed to use it, and only then does part two move
-- the secrets into Vault and empty the column. At no point is there a moment
-- where a deployed function is looking for something that is not there.

ALTER TABLE public.user_credentials
  ADD COLUMN IF NOT EXISTS credential_secret_id uuid;

COMMENT ON COLUMN public.user_credentials.credential_secret_id IS
  'The Supabase Vault secret holding this credential. credential_value is kept NULL once this is set.';

-- One credential per (owner, type, scope) already, so the secret is named after
-- the row and cannot collide with another.
CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_secret_id_idx
  ON public.user_credentials (credential_secret_id)
  WHERE credential_secret_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.read_user_credential(
  _credential_type text,
  _user_id uuid DEFAULT NULL,
  _team_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_row public.user_credentials;
  v_secret text;
BEGIN
  IF _team_id IS NOT NULL THEN
    SELECT * INTO v_row
      FROM public.user_credentials c
     WHERE c.credential_type = _credential_type
       AND c.team_id = _team_id
     LIMIT 1;
  ELSE
    IF _user_id IS NULL THEN
      RAISE EXCEPTION 'read_user_credential needs a user id or a team id'
        USING ERRCODE = 'null_value_not_allowed';
    END IF;
    SELECT * INTO v_row
      FROM public.user_credentials c
     WHERE c.credential_type = _credential_type
       AND c.user_id = _user_id
       AND c.team_id IS NULL
     LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_row.credential_secret_id IS NOT NULL THEN
    SELECT s.decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets s
     WHERE s.id = v_row.credential_secret_id;
    IF v_secret IS NOT NULL THEN
      RETURN v_secret;
    END IF;
  END IF;

  -- The transition window: rows that have not been moved into Vault yet.
  -- Part two empties this column, after which this line returns NULL and the
  -- secret comes from Vault or not at all.
  RETURN v_row.credential_value;
END;
$$;

COMMENT ON FUNCTION public.read_user_credential(text, uuid, uuid) IS
  'The only way to read a stored credential. Service role only, so a decrypted GitHub token is reachable from an edge function and from nowhere else. Finding H3.';

REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.read_user_credential(text, uuid, uuid) TO service_role;
