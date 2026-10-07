-- A blog post keeps its address when its title is edited (2026-10-07 review).
--
-- What was wrong. set_blog_post_slug rebuilt the slug whenever the title
-- changed and the slug was sent unchanged, and the editor always sends the
-- slug it loaded. So fixing a typo in a published post's title moved the post
-- to a new address (every shared link broke), while the editor still showed
-- the old slug and sent it back on the next save, which moved the post back.
-- Draft autosave did this on every pause. There are no posts yet.
--
-- What it changes. The trigger fills in a slug only when none is given, on
-- insert or update. A post changes address only when an admin types a new
-- slug. The editor reads the saved slug back after each save (same day).

CREATE OR REPLACE FUNCTION public.set_blog_post_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_slug(NEW.title);
    new_slug := base_slug;

    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.blog_posts
         WHERE slug = new_slug
           AND id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.set_blog_post_slug() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_blog_post_slug() FROM anon;
REVOKE ALL ON FUNCTION public.set_blog_post_slug() FROM authenticated;
