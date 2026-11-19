-- A creator can put one link to their own project under each published item
-- (#46).
--
-- What was missing. A creator who publishes a prompt, skill, workflow or
-- prompt kit could point readers at their own project only through the
-- profile's website field, which few people see.
--
-- What it changes. One table, creator_links, holds at most one link per item,
-- keyed on (item_type, item_id) like comments and ai_insights. The author
-- reads and writes their own row through row-level security; through column
-- grants they can only ever set the address and the name, so a link cannot
-- approve itself. A new or changed address or name goes back to 'pending',
-- and only an 'approved' link on a public item is ever shown or followed.
-- Nothing here writes 'approved': the link check (#47) does, so until then
-- every link waits.
--
-- anon gets nothing on the table. It reads a shown link through
-- public_creator_link and follows one through follow_creator_link, which
-- counts the click and answers the stored address, never one from the
-- request. Deleting an item deletes its link; deleting an account deletes the
-- items, so it deletes their links too.

CREATE TABLE public.creator_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow', 'prompt_kit')),
  item_id uuid NOT NULL,
  url text NOT NULL CHECK (char_length(url) <= 2048 AND url ~* '^https?://[^[:space:]/?#@]+'),
  label text NOT NULL DEFAULT '' CHECK (char_length(label) <= 40),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'unreachable')),
  checked_at timestamptz,
  reason text,
  click_count integer NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_links_one_per_item UNIQUE (item_type, item_id)
);

COMMENT ON TABLE public.creator_links IS
  'One link per published item to the creator''s own project. Shown and followed (/go/<item-id>) only when status = approved and the item is public.';

CREATE INDEX idx_creator_links_item_id ON public.creator_links (item_id);

ALTER TABLE public.creator_links ENABLE ROW LEVEL SECURITY;

revoke all on public.creator_links from anon;
revoke all on public.creator_links from authenticated;
grant select, delete on public.creator_links to authenticated;
grant insert (item_type, item_id, url, label) on public.creator_links to authenticated;
grant update (url, label) on public.creator_links to authenticated;
grant select, insert, update, delete on public.creator_links to service_role;

CREATE POLICY "Authors read their own creator link"
  ON public.creator_links FOR SELECT TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()));

CREATE POLICY "Authors add a creator link to their own item"
  ON public.creator_links FOR INSERT TO authenticated
  WITH CHECK (public.is_item_owner(item_type, item_id, auth.uid()));

CREATE POLICY "Authors change their own creator link"
  ON public.creator_links FOR UPDATE TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()))
  WITH CHECK (public.is_item_owner(item_type, item_id, auth.uid()));

CREATE POLICY "Authors remove their own creator link"
  ON public.creator_links FOR DELETE TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()));

-- A changed address or name has not been checked, so it waits again. A click
-- changes only click_count and leaves updated_at alone.
CREATE OR REPLACE FUNCTION public.creator_link_changed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF NEW.url IS DISTINCT FROM OLD.url OR NEW.label IS DISTINCT FROM OLD.label THEN
    NEW.status := 'pending';
    NEW.checked_at := NULL;
    NEW.reason := NULL;
  END IF;
  IF (NEW.url, NEW.label, NEW.status, NEW.reason, NEW.checked_at)
     IS DISTINCT FROM (OLD.url, OLD.label, OLD.status, OLD.reason, OLD.checked_at) THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER creator_link_changed
  BEFORE UPDATE ON public.creator_links
  FOR EACH ROW EXECUTE FUNCTION public.creator_link_changed();

CREATE OR REPLACE FUNCTION public.public_creator_link(p_item_type text, p_item_id uuid)
RETURNS TABLE (label text, url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT l.label, l.url
    FROM public.creator_links l
   WHERE l.item_type = p_item_type
     AND l.item_id = p_item_id
     AND l.status = 'approved'
     AND public.is_item_public(l.item_type, l.item_id);
$$;

CREATE OR REPLACE FUNCTION public.follow_creator_link(p_item_id uuid)
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.creator_links l
     SET click_count = l.click_count + 1
   WHERE l.item_id = p_item_id
     AND l.status = 'approved'
     AND public.is_item_public(l.item_type, l.item_id)
  RETURNING l.url;
$$;

REVOKE ALL ON FUNCTION public.public_creator_link(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_creator_link(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.public_creator_link(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.public_creator_link(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_creator_link(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_creator_link(text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.follow_creator_link(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.follow_creator_link(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.follow_creator_link(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.follow_creator_link(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.follow_creator_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.follow_creator_link(uuid) TO service_role;

-- Runs as its owner so a deletion by service_role or an admin removes the
-- link even where the deleting role could not see it.
CREATE OR REPLACE FUNCTION public.delete_creator_link_of_artifact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  DELETE FROM public.creator_links
   WHERE item_type = CASE TG_TABLE_NAME
                       WHEN 'prompts'     THEN 'prompt'
                       WHEN 'skills'      THEN 'skill'
                       WHEN 'workflows'   THEN 'workflow'
                       WHEN 'prompt_kits' THEN 'prompt_kit'
                     END
     AND item_id = OLD.id;
  RETURN OLD;
END;
$fn$;

REVOKE ALL ON FUNCTION public.delete_creator_link_of_artifact() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_creator_link_of_artifact() FROM anon;
REVOKE ALL ON FUNCTION public.delete_creator_link_of_artifact() FROM authenticated;

DROP TRIGGER IF EXISTS delete_creator_link ON public.prompts;
CREATE TRIGGER delete_creator_link
  AFTER DELETE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.delete_creator_link_of_artifact();

DROP TRIGGER IF EXISTS delete_creator_link ON public.skills;
CREATE TRIGGER delete_creator_link
  AFTER DELETE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.delete_creator_link_of_artifact();

DROP TRIGGER IF EXISTS delete_creator_link ON public.workflows;
CREATE TRIGGER delete_creator_link
  AFTER DELETE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.delete_creator_link_of_artifact();

DROP TRIGGER IF EXISTS delete_creator_link ON public.prompt_kits;
CREATE TRIGGER delete_creator_link
  AFTER DELETE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.delete_creator_link_of_artifact();
