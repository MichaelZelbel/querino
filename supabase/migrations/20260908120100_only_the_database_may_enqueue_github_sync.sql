-- Finding 2 of the 2026-09-08 audit.
--
-- enqueue_github_sync is SECURITY DEFINER and was never revoked from anyone, so
-- the default grant to PUBLIC stood and PostgREST served it to the anon key at
-- /rpc/enqueue_github_sync. Its arguments are the artifact id, the operation
-- and the owner whose GitHub token the worker should use. Anyone could
-- therefore have a stranger's private prompt committed into their own
-- repository, or have a file deleted from a stranger's repository with that
-- stranger's token.
--
-- Only the four tg_github_sync_* trigger functions are meant to call it. They
-- are SECURITY DEFINER and owned by postgres, so they keep working when the
-- table's own users lose the right.

REVOKE ALL ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) TO service_role;
