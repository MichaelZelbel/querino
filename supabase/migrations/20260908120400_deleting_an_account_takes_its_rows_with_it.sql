-- Finding 5 of the 2026-09-08 audit.
--
-- activity_events.actor_id was NOT NULL since 20260821170000 but its foreign
-- key still said ON DELETE SET NULL, so deleting any profile with an event
-- failed on the not-null rule. suggestions.reviewer_id had no delete action at
-- all, so a user who had ever reviewed a suggestion could not be deleted. And
-- prompt_kit_pins, prompt_kit_reviews and moderation_review_queue had no
-- foreign key to profiles, so their rows (one holding a content snapshot)
-- outlived the account. delete-user and delete-my-account both depend on the
-- cascade from auth.users, so for most real accounts deletion returned 500.

ALTER TABLE public.activity_events
  DROP CONSTRAINT IF EXISTS activity_events_actor_id_fkey;
ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.suggestions
  DROP CONSTRAINT IF EXISTS suggestions_reviewer_id_fkey;
ALTER TABLE public.suggestions
  ADD CONSTRAINT suggestions_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Rows whose user no longer exists are already orphans; the key cannot be
-- added over them, and nothing can ever read them again.
DELETE FROM public.prompt_kit_pins WHERE user_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.prompt_kit_reviews WHERE user_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.moderation_review_queue WHERE user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.prompt_kit_pins
  DROP CONSTRAINT IF EXISTS prompt_kit_pins_user_id_fkey;
ALTER TABLE public.prompt_kit_pins
  ADD CONSTRAINT prompt_kit_pins_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.prompt_kit_reviews
  DROP CONSTRAINT IF EXISTS prompt_kit_reviews_user_id_fkey;
ALTER TABLE public.prompt_kit_reviews
  ADD CONSTRAINT prompt_kit_reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.moderation_review_queue
  DROP CONSTRAINT IF EXISTS moderation_review_queue_user_id_fkey;
ALTER TABLE public.moderation_review_queue
  ADD CONSTRAINT moderation_review_queue_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
