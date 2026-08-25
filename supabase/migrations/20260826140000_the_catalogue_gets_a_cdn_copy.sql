-- A CDN-served copy of the model catalogue.
--
-- The llm-models endpoint is open on purpose: it mirrors a catalogue OpenRouter
-- already serves to the public with no key, and Menerio and the hub are meant
-- to read it. The obvious worry is somebody hammering it, and the plan was to
-- answer that with Cache-Control so Cloudflare would serve repeat requests
-- itself.
--
-- That plan did not survive being tested. Measured on 2026-08-26, on this
-- project:
--
--   an edge function response   CF-Cache-Status: DYNAMIC, on every hit, even
--                               with `Cache-Control: public, s-maxage=3600`
--   a public storage object     CF-Cache-Status: HIT, first hit onwards
--
-- Supabase fronts both with Cloudflare, but only Storage is actually cached.
-- So the catalogue also gets written to a public bucket as one JSON file, and
-- that URL is the one to hand to another application: it is served by the CDN,
-- costs no function invocation, and cannot be made expensive by traffic.
--
-- The endpoint stays. It is the one that filters, and it is always current
-- rather than current as of the last sync. Two doors, different jobs:
--
--   /storage/v1/object/public/llm-catalogue/models.json   whole list, CDN, free
--   /functions/v1/llm-models?tools=true&...               filtered, live

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('llm-catalogue', 'llm-catalogue', true)
ON CONFLICT (id) DO NOTHING;

-- Read by anyone, which is the entire point of this bucket.
CREATE POLICY "Public can read the model catalogue"
ON storage.objects
FOR SELECT
USING (bucket_id = 'llm-catalogue');

-- Written by nobody through this API. sync-llm-models uploads with the service
-- role, which bypasses row-level security, so there is deliberately no INSERT,
-- UPDATE or DELETE policy here: a signed-in admin has no more business
-- overwriting this file by hand than a stranger does. It is a machine's output,
-- and the machine that makes it runs every night.

COMMIT;
