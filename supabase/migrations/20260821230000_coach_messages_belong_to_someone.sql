-- A coach conversation that belongs to nobody is readable by nobody.
--
-- Not one of the audit's numbered findings; found while checking the Lovable
-- publish gate. 74 of the 80 rows in prompt_coach_messages had a NULL user_id,
-- and the read policy is `user_id = auth.uid()`, so those conversations were
-- invisible to the people who had them. The app's own loadHistory filters on
-- user_id too, so the coach quietly forgot everything in them.
--
-- The current code (supabase/functions/_shared/coach.ts) does set user_id on
-- every insert, so this is history rather than an open leak. What it needs is
-- for the column to stop being optional, so it cannot happen again.
--
-- What happens to the 74:
--
--   12 are recoverable. Their session_id is 'personal:<user_id>:<artifact>',
--      so the owner is written into the key. Those get their user_id back and
--      the conversations become readable by the people who had them.
--
--   62 are not. Their session_id is a bare UUID matching no artifact that
--      still exists, or the string 23423423423423424234, which is somebody
--      testing. Nobody can read them, nobody can be told they exist, and
--      nobody can ask for them to be deleted, because no account is attached.
--      Keeping conversation text in that state serves no one and is exactly
--      the kind of data that should not be retained, so they go.
--
-- The session ids being dropped, for the record:
--   18106b68, 1bab25b0, 23423423423423424234, 2bcc13f2, 59d87641, 871da04e,
--   8d8a5cda, b0e9a077, c618c175, ee8a8cdb, eee94a63

-- ---------------------------------------------------------------------------
-- Recover what the session key still knows
-- ---------------------------------------------------------------------------

UPDATE public.prompt_coach_messages m
   SET user_id = substring(m.session_id from 'personal:([0-9a-f-]{36}):')::uuid
 WHERE m.user_id IS NULL
   AND m.session_id LIKE 'personal:%:%'
   AND substring(m.session_id from 'personal:([0-9a-f-]{36}):')::uuid
       IN (SELECT id FROM auth.users);

-- ---------------------------------------------------------------------------
-- Drop what nobody can ever reach
-- ---------------------------------------------------------------------------

DELETE FROM public.prompt_coach_messages WHERE user_id IS NULL;
DELETE FROM public.prompt_kit_coach_messages WHERE user_id IS NULL;

-- ---------------------------------------------------------------------------
-- And stop it being possible
-- ---------------------------------------------------------------------------

-- The writer is an edge function holding the service role, where auth.uid() is
-- NULL, so the default is not what protects these tables; coach.ts passing
-- user_id is. The default is here for the other direction: a browser insert
-- that forgets the column now gets the caller rather than a row nobody owns.
ALTER TABLE public.prompt_coach_messages     ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.prompt_kit_coach_messages ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.prompt_coach_messages     ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.prompt_kit_coach_messages ALTER COLUMN user_id SET NOT NULL;

-- Deleting an account left its coach conversations behind: neither
-- delete-my-account nor delete-user touches these tables, and there was no
-- foreign key to do it for them.
ALTER TABLE public.prompt_coach_messages
  DROP CONSTRAINT IF EXISTS prompt_coach_messages_user_id_fkey;
ALTER TABLE public.prompt_coach_messages
  ADD CONSTRAINT prompt_coach_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.prompt_kit_coach_messages
  DROP CONSTRAINT IF EXISTS prompt_kit_coach_messages_user_id_fkey;
ALTER TABLE public.prompt_kit_coach_messages
  ADD CONSTRAINT prompt_kit_coach_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- loadHistory reads (user_id, session_id) ordered by id, every coach turn.
CREATE INDEX IF NOT EXISTS prompt_coach_messages_session_idx
  ON public.prompt_coach_messages (user_id, session_id, id);
CREATE INDEX IF NOT EXISTS prompt_kit_coach_messages_session_idx
  ON public.prompt_kit_coach_messages (user_id, session_id, id);

COMMENT ON COLUMN public.prompt_coach_messages.user_id IS
  'Who the conversation belongs to. NOT NULL because the read policy is user_id = auth.uid(), so a NULL here is a conversation its own author cannot see.';
