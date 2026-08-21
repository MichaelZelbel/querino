-- Finding H3, part two of two: the GitHub tokens stop being plain text.
--
-- Part one added credential_secret_id and read_user_credential, and the two
-- functions that consume a token were deployed to use the reader while it
-- still fell back to the column. So by the time this runs, nothing is reading
-- credential_value any more and the column can be emptied.
--
-- What changes for a user: nothing they can see. The browser has not selected
-- the token since Phase 0, and it still writes the same column on save. The
-- trigger below takes what it wrote, puts it in Vault, and leaves the column
-- NULL, so the plaintext is never at rest and never in a database backup.

-- ---------------------------------------------------------------------------
-- Writing a credential puts it in Vault instead of in the row
-- ---------------------------------------------------------------------------

-- The column becomes write-only, so it has to be allowed to be empty. NOT NULL
-- on it used to mean "a credential row always carries its secret"; that job
-- now belongs to credential_secret_id, and the constraint at the bottom of
-- this file is what says so.
ALTER TABLE public.user_credentials
  ALTER COLUMN credential_value DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.encrypt_user_credential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_secret_id uuid;
BEGIN
  -- Nothing new supplied: keep whatever secret the row already points at.
  -- This is the ordinary case for an UPDATE that only changes updated_at, and
  -- for the Settings page saving a form where the token box still holds the
  -- bullet placeholder rather than a token.
  IF NEW.credential_value IS NULL OR NEW.credential_value = '' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.credential_secret_id := COALESCE(NEW.credential_secret_id, OLD.credential_secret_id);
    END IF;
    NEW.credential_value := NULL;
    RETURN NEW;
  END IF;

  v_secret_id := CASE WHEN TG_OP = 'UPDATE' THEN OLD.credential_secret_id ELSE NULL END;

  IF v_secret_id IS NULL THEN
    v_secret_id := vault.create_secret(
      NEW.credential_value,
      'user_credentials:' || NEW.id::text,
      'Querino ' || NEW.credential_type || ' credential'
    );
  ELSE
    PERFORM vault.update_secret(v_secret_id, NEW.credential_value);
  END IF;

  NEW.credential_secret_id := v_secret_id;

  -- The whole point. The row never holds the secret.
  NEW.credential_value := NULL;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.encrypt_user_credential() IS
  'Moves a written credential into Supabase Vault and blanks the column, so credential_value is never at rest in the table. Finding H3.';

DROP TRIGGER IF EXISTS encrypt_user_credential_on_write ON public.user_credentials;
CREATE TRIGGER encrypt_user_credential_on_write
  BEFORE INSERT OR UPDATE ON public.user_credentials
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_user_credential();

-- ---------------------------------------------------------------------------
-- Deleting a credential deletes its secret
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_user_credential_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
BEGIN
  IF OLD.credential_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = OLD.credential_secret_id;
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.delete_user_credential_secret() IS
  'Removes the Vault secret when its credential row goes, so deleting an account really does remove the token. Finding H3.';

DROP TRIGGER IF EXISTS delete_user_credential_secret_on_delete ON public.user_credentials;
CREATE TRIGGER delete_user_credential_secret_on_delete
  AFTER DELETE ON public.user_credentials
  FOR EACH ROW EXECUTE FUNCTION public.delete_user_credential_secret();

-- ---------------------------------------------------------------------------
-- Move what is already there
-- ---------------------------------------------------------------------------

DO $migrate$
DECLARE
  r record;
  v_id uuid;
  v_moved integer := 0;
BEGIN
  FOR r IN
    SELECT id, credential_type, credential_value
      FROM public.user_credentials
     WHERE credential_value IS NOT NULL
       AND credential_value <> ''
       AND credential_secret_id IS NULL
  LOOP
    v_id := vault.create_secret(
      r.credential_value,
      'user_credentials:' || r.id::text,
      'Querino ' || r.credential_type || ' credential'
    );

    -- Setting credential_value to NULL in the same statement sends the write
    -- trigger down its "nothing new supplied" branch, which keeps the secret id
    -- being set here rather than creating a second secret. Disabling the
    -- trigger instead is not possible: ALTER TABLE cannot run while this loop
    -- is reading the same table.
    UPDATE public.user_credentials
       SET credential_secret_id = v_id,
           credential_value = NULL
     WHERE id = r.id;

    v_moved := v_moved + 1;
  END LOOP;

  RAISE NOTICE 'Moved % credential(s) into Vault', v_moved;
END $migrate$;

-- Every row that has a credential now has it in Vault, and none of them has it
-- in the column. If that is ever false again, this fails the migration.
DO $verify$
DECLARE
  v_plaintext integer;
BEGIN
  SELECT count(*) INTO v_plaintext
    FROM public.user_credentials
   WHERE credential_value IS NOT NULL AND credential_value <> '';

  IF v_plaintext > 0 THEN
    RAISE EXCEPTION '% credential(s) are still stored in plain text', v_plaintext;
  END IF;
END $verify$;

-- ---------------------------------------------------------------------------
-- And nobody but the service role can select the column at all
-- ---------------------------------------------------------------------------

-- It is NULL for every row now, so this changes nothing that works. It is here
-- so that a future row written by some path that bypasses the trigger is still
-- not readable by a browser.
REVOKE SELECT ON public.user_credentials FROM authenticated;
REVOKE SELECT ON public.user_credentials FROM anon;

GRANT SELECT (id, user_id, credential_type, team_id, created_at, updated_at)
  ON public.user_credentials TO authenticated;

COMMENT ON COLUMN public.user_credentials.credential_value IS
  'Write-only. A value written here is moved into Vault by encrypt_user_credential_on_write and the column is left NULL. Read through read_user_credential. Finding H3.';

-- A credential row that carries neither a secret id nor a value is a row that
-- silently does nothing, which is how a GitHub sync fails without a reason.
ALTER TABLE public.user_credentials
  DROP CONSTRAINT IF EXISTS user_credentials_has_a_secret;

ALTER TABLE public.user_credentials
  ADD CONSTRAINT user_credentials_has_a_secret
  CHECK (credential_secret_id IS NOT NULL OR credential_value IS NOT NULL);
