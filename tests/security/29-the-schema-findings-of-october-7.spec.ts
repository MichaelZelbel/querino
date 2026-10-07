// The database findings of the 2026-10-07 review, migrations 20261007120000 to
// 20261007130000. One SQL probe acts as each person involved, inside a
// transaction that is always rolled back, and reports one line per finding;
// each test below reads its own line. The same probe was run on production
// before the migrations (every hole line said FAIL, every ordinary flow OK)
// and after them (all OK).
//
// It needs SUPABASE_ACCESS_TOKEN, so it skips in CI on purpose, like the
// other probes (see helpers/api.ts).

import { test, expect } from "@playwright/test";
import { hasManagementToken, sqlProbe } from "./helpers/api";

const NEEDS_TOKEN = "needs SUPABASE_ACCESS_TOKEN; skipped in CI on purpose";

const PROBE = `
DO $probe$
DECLARE
  log text := '';
  v_team uuid; v_owner uuid; v_member uuid; v_prem uuid; v_writer uuid;
  v_prompt uuid; v_author uuid; v_tp uuid;
  v_sugg uuid; v_rows integer; v_ts timestamptz; v_cid uuid; v_tok text;
  v_n integer; v_before integer; v_after integer; v_uuid uuid; v_text text;
BEGIN
  SELECT t.id, t.owner_id INTO v_team, v_owner FROM public.teams t LIMIT 1;
  SELECT tm.user_id INTO v_member FROM public.team_members tm
   WHERE tm.team_id = v_team AND tm.role = 'member' LIMIT 1;
  SELECT p.id, p.author_id INTO v_prompt, v_author FROM public.prompts p
   WHERE p.is_public AND p.team_id IS NULL AND p.author_id IS NOT NULL
   ORDER BY p.created_at, p.id LIMIT 1;
  SELECT r.user_id INTO v_prem FROM public.user_roles r
   WHERE r.role IN ('admin', 'premium_gift', 'premium')
     AND r.user_id NOT IN (SELECT user_id FROM public.team_members) LIMIT 1;
  SELECT pr.id INTO v_writer FROM public.profiles pr
   WHERE pr.id NOT IN (v_author, v_member, coalesce(v_prem, v_author), v_owner)
     AND NOT EXISTS (SELECT 1 FROM public.user_suspensions s WHERE s.user_id = pr.id AND s.suspended)
   ORDER BY pr.created_at LIMIT 1;
  SELECT p.id INTO v_tp FROM public.prompts p
   WHERE p.team_id = v_team AND p.author_id = v_owner LIMIT 1;

  IF v_team IS NULL OR v_member IS NULL OR v_tp IS NULL OR v_writer IS NULL OR v_prompt IS NULL THEN
    RAISE EXCEPTION 'PROBE SKIP needs a team with a member, a team prompt of its owner, a public prompt and a spare account';
  END IF;

  -- P1: only its author changes what a suggestion says
  INSERT INTO public.suggestions (item_type, item_id, author_id, title, description, content)
  VALUES ('prompt', v_prompt, v_writer, 'probe', 'probe', 'probe text') RETURNING id INTO v_sugg;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.suggestions SET content = 'edited by its author' WHERE id = v_sugg;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RESET ROLE;
  log := log || format(E'\nP1a author edits own suggestion: %s', CASE WHEN v_rows = 1 THEN 'OK' ELSE 'FAIL' END);
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    UPDATE public.suggestions SET content = 'forged by the owner' WHERE id = v_sugg;
    RESET ROLE;
    log := log || E'\nP1b owner rewrites someone else''s suggestion: FAIL (allowed)';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP1b owner rewrites someone else''s suggestion: OK (refused)';
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.suggestions SET status = 'accepted', reviewer_id = v_author WHERE id = v_sugg;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RESET ROLE;
  log := log || format(E'\nP1c owner reviews it: %s', CASE WHEN v_rows = 1 THEN 'OK' ELSE 'FAIL' END);

  -- P2: created_at is the server's
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET created_at = '2999-01-01' WHERE id = v_prompt;
  RESET ROLE;
  SELECT created_at INTO v_ts FROM public.prompts WHERE id = v_prompt;
  log := log || format(E'\nP2a author dates own prompt 2999: %s', CASE WHEN v_ts < now() + interval '1 day' THEN 'OK (kept)' ELSE 'FAIL (stuck)' END);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.comments (user_id, item_type, item_id, content, created_at)
  VALUES (v_writer, 'prompt', v_prompt, 'probe comment', '2999-01-01') RETURNING id INTO v_cid;
  RESET ROLE;
  SELECT created_at INTO v_ts FROM public.comments WHERE id = v_cid;
  log := log || format(E'\nP2b comment inserted with 2999: %s', CASE WHEN v_ts < now() + interval '1 day' THEN 'OK (now)' ELSE 'FAIL' END);

  -- P5a: a comment files its own review row
  SELECT count(*) INTO v_n FROM public.moderation_review_queue
   WHERE item_type = 'comment' AND item_id = v_cid AND user_id = v_writer AND status = 'pending';
  log := log || format(E'\nP5a comment queued under its own id: %s', CASE WHEN v_n = 1 THEN 'OK' ELSE 'FAIL' END);

  -- P10: copies
  SELECT copies_count INTO v_before FROM public.prompts WHERE id = v_prompt;
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
  PERFORM set_config('request.headers', '{"cf-connecting-ip":"2001:db8:1:2::5","x-forwarded-for":"2001:db8:1:2::5"}', true);
  PERFORM public.record_prompt_copy(v_prompt);
  PERFORM set_config('request.headers', '{"cf-connecting-ip":"2001:db8:1:2:ffff::9"}', true);
  PERFORM public.record_prompt_copy(v_prompt);
  PERFORM set_config('request.headers', '{"cf-connecting-ip":"198.51.100.7"}', true);
  PERFORM public.record_prompt_copy(v_prompt);
  PERFORM public.record_prompt_copy(v_prompt);
  PERFORM set_config('request.headers', '{"x-forwarded-for":"192.0.2.1"}', true);
  PERFORM public.record_prompt_copy(v_prompt);
  PERFORM set_config('request.headers', '', true);
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM public.record_prompt_copy(v_prompt);
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM public.record_prompt_copy(v_prompt);
  PERFORM public.record_prompt_copy(v_prompt);
  RESET ROLE;
  SELECT copies_count INTO v_after FROM public.prompts WHERE id = v_prompt;
  log := log || format(E'\nP10a copies: one /64, one IPv4, no XFF-only, not the author, one signed-in = +3: %s (+%s)',
    CASE WHEN v_after - v_before = 3 THEN 'OK' ELSE 'FAIL' END, v_after - v_before);
  SELECT count(*) INTO v_n FROM public.prompt_copy_events e
   WHERE e.prompt_id = v_prompt AND e.copied_on = current_date
     AND e.visitor_key IN (encode(extensions.digest(v_writer::text || '|' || current_date::text, 'sha256'), 'hex'),
                           encode(extensions.digest('u:' || v_writer::text || '|' || current_date::text, 'sha256'), 'hex'));
  log := log || format(E'\nP10b visitor key is not the date-salted hash: %s', CASE WHEN v_n = 0 THEN 'OK' ELSE 'FAIL' END);
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_n FROM public.prompt_copy_salts;
    RESET ROLE;
    log := log || E'\nP10c browser reads the salts: FAIL';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP10c browser reads the salts: OK (refused)';
  END;
  RESET ROLE;

  -- P3: invites
  INSERT INTO public.team_invites (team_id, created_by, role)
  VALUES (v_team, v_member, 'admin') RETURNING token INTO v_tok;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM public.get_team_invite_preview(v_tok);
  RESET ROLE;
  log := log || format(E'\nP3a preview of an invite whose maker is a plain member: %s', CASE WHEN v_n = 0 THEN 'OK (none)' ELSE 'FAIL' END);
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    PERFORM * FROM public.redeem_team_invite(v_tok);
    RESET ROLE;
    log := log || E'\nP3b redeem it: FAIL (accepted)';
  EXCEPTION WHEN raise_exception THEN
    log := log || format(E'\nP3b redeem it: OK (%s)', SQLERRM);
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  UPDATE public.team_members SET role = 'admin' WHERE team_id = v_team AND user_id = v_member;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM public.get_team_invite_preview(v_tok);
  RESET ROLE;
  log := log || format(E'\nP3c same invite once its maker is admin: %s', CASE WHEN v_n = 1 THEN 'OK (shown)' ELSE 'FAIL' END);
  PERFORM set_config('request.jwt.claims', '', true);
  UPDATE public.team_members SET role = 'member' WHERE team_id = v_team AND user_id = v_member;
  SELECT count(*) INTO v_n FROM public.team_invites WHERE token = v_tok;
  log := log || format(E'\nP3d demoting the maker deletes the invite: %s', CASE WHEN v_n = 0 THEN 'OK' ELSE 'FAIL' END);
  BEGIN
    INSERT INTO public.team_invites (team_id, created_by, role, expires_at)
    VALUES (v_team, v_owner, 'member', 'infinity');
    log := log || E'\nP3e invite that never expires: FAIL (stored)';
  EXCEPTION WHEN check_violation THEN
    log := log || E'\nP3e invite that never expires: OK (refused)';
  END;
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    INSERT INTO public.team_invites (team_id, created_by, role, created_at, expires_at)
    VALUES (v_team, v_owner, 'member', '2999-01-01', '2999-01-20');
    RESET ROLE;
    log := log || E'\nP3f invite stretched by a future created_at: FAIL (stored)';
  EXCEPTION WHEN check_violation THEN
    log := log || E'\nP3f invite stretched by a future created_at: OK (refused)';
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.team_invites (team_id, created_by, role) VALUES (v_team, v_owner, 'member');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RESET ROLE;
  log := log || format(E'\nP3g owner makes an ordinary invite: %s', CASE WHEN v_rows = 1 THEN 'OK' ELSE 'FAIL' END);

  -- P4: the editor answers for the edit
  PERFORM set_config('request.jwt.claims', '', true);
  UPDATE public.prompts SET is_public = true WHERE id = v_tp;
  DELETE FROM public.moderation_review_queue WHERE item_id = v_tp AND status = 'pending';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET content = coalesce(content, '') || ' (probe edit)' WHERE id = v_tp;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RESET ROLE;
  SELECT editor_id INTO v_uuid FROM public.moderation_review_queue
   WHERE item_type = 'prompt' AND item_id = v_tp AND status = 'pending' AND user_id = v_owner;
  log := log || format(E'\nP4a teammate edits a public team prompt (%s row): review names the teammate: %s',
    v_rows, CASE WHEN v_uuid = v_member THEN 'OK' ELSE 'FAIL' END);
  INSERT INTO public.user_suspensions (user_id, suspended) VALUES (v_member, true)
  ON CONFLICT (user_id) DO UPDATE SET suspended = true, suspended_until = NULL;
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    UPDATE public.prompts SET content = coalesce(content, '') || ' (suspended edit)' WHERE id = v_tp;
    RESET ROLE;
    log := log || E'\nP4b suspended teammate publishes through the owner''s prompt: FAIL (allowed)';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP4b suspended teammate publishes through the owner''s prompt: OK (refused)';
  END;
  RESET ROLE;
  SELECT pg_get_function_result('public.claim_moderation_review_queue(integer, interval)'::regprocedure) INTO v_text;
  log := log || format(E'\nP4c claim returns editor_id: %s', CASE WHEN v_text LIKE '%editor_id%' THEN 'OK' ELSE 'FAIL' END);

  -- P9: activity on a team item reaches the team (member is still suspended,
  -- which does not matter for activity)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.activity_events (actor_id, action, item_type, item_id, metadata)
  VALUES (v_member, 'comment', 'prompt', v_tp, '{}') RETURNING team_id INTO v_uuid;
  RESET ROLE;
  log := log || format(E'\nP9 activity on a team prompt takes its team: %s', CASE WHEN v_uuid = v_team THEN 'OK' ELSE 'FAIL' END);

  -- P5b: a suspended account cannot comment
  INSERT INTO public.user_suspensions (user_id, suspended) VALUES (v_writer, true)
  ON CONFLICT (user_id) DO UPDATE SET suspended = true, suspended_until = NULL;
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    INSERT INTO public.comments (user_id, item_type, item_id, content)
    VALUES (v_writer, 'prompt', v_prompt, 'suspended comment');
    RESET ROLE;
    log := log || E'\nP5b suspended account comments: FAIL (allowed)';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP5b suspended account comments: OK (refused)';
  END;
  RESET ROLE;

  -- P6: the browser cannot write an AI insight
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    INSERT INTO public.ai_insights (item_type, item_id, summary) VALUES ('prompt', v_prompt, 'forged');
    RESET ROLE;
    log := log || E'\nP6 owner writes an AI insight: FAIL (allowed)';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP6 owner writes an AI insight: OK (refused)';
  END;
  RESET ROLE;

  -- P7: a seat comes from an invite
  IF v_prem IS NULL THEN
    log := log || E'\nP7 n/a: no Premium account outside the team';
  ELSE
    BEGIN
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      INSERT INTO public.team_members (team_id, user_id, role) VALUES (v_team, v_prem, 'member');
      RESET ROLE;
      log := log || E'\nP7 owner seats a Premium user unasked: FAIL (allowed)';
    EXCEPTION WHEN insufficient_privilege THEN
      log := log || E'\nP7 owner seats a Premium user unasked: OK (refused)';
    END;
    RESET ROLE;
  END IF;

  -- P11: suggestions remember what they were written against; only the author changes it
  INSERT INTO public.suggestions (item_type, item_id, author_id, title, content, base_content)
  VALUES ('prompt', v_prompt, v_writer, 'probe 2', 'probe text 2', 'the old text') RETURNING id INTO v_sugg;
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    UPDATE public.suggestions SET base_content = 'rewritten by the owner' WHERE id = v_sugg;
    RESET ROLE;
    log := log || E'\nP11 owner rewrites what a suggestion was written against: FAIL (allowed)';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP11 owner rewrites what a suggestion was written against: OK (refused)';
  END;
  RESET ROLE;

  -- P12: a comment blanked by its author files no paid review
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.comments (user_id, item_type, item_id, content)
  VALUES (v_author, 'prompt', v_prompt, 'to be deleted') RETURNING id INTO v_cid;
  RESET ROLE;
  DELETE FROM public.moderation_review_queue WHERE item_type = 'comment' AND item_id = v_cid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.comments SET content = '[This comment was deleted by its author.]' WHERE id = v_cid;
  RESET ROLE;
  SELECT count(*) INTO v_n FROM public.moderation_review_queue WHERE item_type = 'comment' AND item_id = v_cid;
  log := log || format(E'\nP12 a comment deleted by its author is not sent for review: %s', CASE WHEN v_n = 0 THEN 'OK' ELSE 'FAIL' END);

  -- P13: similar-artifact search is exact
  SELECT count(*) INTO v_n FROM pg_indexes
   WHERE schemaname = 'public' AND indexdef ILIKE '%ivfflat%';
  log := log || format(E'\nP13 no one-probe ivfflat index left: %s', CASE WHEN v_n = 0 THEN 'OK' ELSE 'FAIL' END);

  -- P14: a blog post keeps its address when its title changes
  SELECT pg_get_functiondef('public.set_blog_post_slug()'::regprocedure) INTO v_text;
  log := log || format(E'\nP14 the blog slug trigger no longer follows the title: %s', CASE WHEN v_text NOT LIKE '%OLD.title%' THEN 'OK' ELSE 'FAIL' END);

  -- P15: blog media takes images only
  SELECT count(*) INTO v_n FROM storage.buckets
   WHERE id = 'blog-media' AND file_size_limit IS NOT NULL
     AND NOT ('image/svg+xml' = ANY (allowed_mime_types)) AND 'image/png' = ANY (allowed_mime_types);
  log := log || format(E'\nP15 blog media is limited to images: %s', CASE WHEN v_n = 1 THEN 'OK' ELSE 'FAIL' END);

  -- P16: an admin balance change is applied and recorded together
  SELECT a.id INTO v_uuid FROM public.ai_allowance_periods a ORDER BY a.period_start DESC, a.id LIMIT 1;
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_writer, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    PERFORM * FROM public.admin_adjust_allowance(v_uuid, 100, 0, 'token_modal');
    RESET ROLE;
    log := log || E'\nP16a a non-admin changes a balance: FAIL (allowed)';
  EXCEPTION WHEN insufficient_privilege THEN
    log := log || E'\nP16a a non-admin changes a balance: OK (refused)';
  END;
  RESET ROLE;
  SELECT r.user_id INTO v_text FROM public.user_roles r WHERE r.role = 'admin' LIMIT 1;
  SELECT tokens_granted INTO v_before FROM public.ai_allowance_periods WHERE id = v_uuid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_text, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM * FROM public.admin_adjust_allowance(v_uuid, 100, 0, 'token_modal');
  RESET ROLE;
  SELECT tokens_granted INTO v_after FROM public.ai_allowance_periods WHERE id = v_uuid;
  SELECT count(*) INTO v_n FROM public.admin_allowance_adjustments
   WHERE allowance_period_id = v_uuid AND admin_id::text = v_text AND new_tokens_granted = v_after;
  log := log || format(E'\nP16b an admin change lands with its record: %s', CASE WHEN v_after = v_before + 100 AND v_n = 1 THEN 'OK' ELSE 'FAIL' END);

  -- P17: two editors while a review is pending means nobody is struck automatically
  DELETE FROM public.user_suspensions WHERE user_id = v_member;
  DELETE FROM public.moderation_review_queue WHERE item_id = v_tp AND status = 'pending';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET content = coalesce(content, '') || ' (owner edit)' WHERE id = v_tp;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET content = coalesce(content, '') || ' (typo fix)' WHERE id = v_tp;
  RESET ROLE;
  SELECT count(*) INTO v_n FROM public.moderation_review_queue
   WHERE item_type = 'prompt' AND item_id = v_tp AND status = 'pending' AND editors_mixed;
  log := log || format(E'\nP17 two editors on one pending review are marked mixed: %s', CASE WHEN v_n = 1 THEN 'OK' ELSE 'FAIL' END);

  -- P18: a suspended account can still take its own comment back
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.comments (user_id, item_type, item_id, content)
  VALUES (v_author, 'prompt', v_prompt, 'written before the suspension');
  RESET ROLE;
  INSERT INTO public.user_suspensions (user_id, suspended) VALUES (v_author, true)
  ON CONFLICT (user_id) DO UPDATE SET suspended = true, suspended_until = NULL;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.comments SET content = '[This comment was deleted by its author.]'
   WHERE user_id = v_author AND item_id = v_prompt AND content <> '[This comment was deleted by its author.]';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RESET ROLE;
  log := log || format(E'\nP18 a suspended account takes its own comment back: %s', CASE WHEN v_rows >= 1 THEN 'OK' ELSE 'FAIL (no comment changed)' END);
  DELETE FROM public.user_suspensions WHERE user_id = v_author;

  -- P8: indexes
  SELECT count(*) INTO v_n FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (
    'idx_menerio_sync_queue_artifact', 'idx_menerio_sync_queue_user_id', 'idx_collections_team_id',
    'idx_teams_owner_id', 'idx_suggestions_author_id', 'idx_prompt_reviews_user_id',
    'idx_skill_reviews_user_id', 'idx_workflow_reviews_user_id', 'idx_prompt_kit_reviews_user_id',
    'idx_skills_published', 'idx_workflows_published');
  log := log || format(E'\nP8 new indexes: %s of 11', v_n);

  RAISE EXCEPTION 'PROBE DONE%', log;
END $probe$;
`;

let probeRun: Promise<string> | null = null;
function probe(): Promise<string> {
  probeRun ??= sqlProbe(PROBE);
  return probeRun;
}

async function line(id: string): Promise<string> {
  const out = await probe();
  test.skip(out.includes("PROBE SKIP"), out);
  expect(out, out).toContain("PROBE DONE");
  const found = out
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith(id + " "));
  expect(found, `no line ${id} in: ${out}`).toBeTruthy();
  return found as string;
}

const CASES: Array<[string, string]> = [
  ["P1a", "an author edits their own open suggestion"],
  ["P1b", "an artifact owner cannot rewrite someone else's suggestion"],
  ["P1c", "an artifact owner can still review a suggestion"],
  ["P2a", "an author cannot date their own prompt into the future"],
  ["P2b", "a comment gets the server's created_at"],
  ["P5a", "a comment files its own AI review row"],
  ["P5b", "a suspended account cannot comment"],
  [
    "P10a",
    "copies count once per visitor: one IPv6 /64, no client-written address, never the author",
  ],
  ["P10b", "a copy's visitor key is not the guessable date-salted hash"],
  ["P10c", "the browser cannot read the daily copy keys"],
  ["P3a", "an invite whose maker is no longer an admin names no team"],
  ["P3b", "an invite whose maker is no longer an admin cannot be redeemed"],
  ["P3c", "an invite works while its maker is an admin"],
  ["P3d", "demoting an admin deletes the invites they made"],
  ["P3e", "an invite cannot be made to last for ever"],
  ["P3f", "an invite cannot be stretched with a future created_at"],
  ["P3g", "an owner still makes an ordinary invite"],
  ["P4a", "the AI review of a teammate's edit names the teammate"],
  [
    "P4b",
    "a suspended teammate cannot publish through someone else's artifact",
  ],
  ["P4c", "the moderation claim returns the editor"],
  ["P9", "activity on a team item reaches the team"],
  ["P6", "the browser cannot write an AI insight"],
  ["P7", "a team owner cannot seat a Premium user who was not invited"],
  ["P8", "the new indexes exist"],
  ["P11", "an owner cannot rewrite what a suggestion was written against"],
  ["P12", "a comment its author deleted is not sent for a paid review"],
  ["P13", "similar-artifact search is exact, with no one-probe ivfflat index"],
  ["P14", "a blog post keeps its address when its title changes"],
  ["P15", "blog media takes images only"],
  ["P16a", "a non-admin cannot change a balance"],
  ["P16b", "an admin's balance change lands together with its record"],
  ["P17", "two editors on one pending review strike nobody automatically"],
  ["P18", "a suspended account can still take its own comment back"],
];

test.describe("The schema findings of October 7", () => {
  for (const [id, title] of CASES) {
    test(title, async () => {
      test.skip(!hasManagementToken(), NEEDS_TOKEN);
      const result = await line(id);
      if (id === "P7" && result.includes("n/a")) test.skip(true, result);
      expect(result, result).not.toContain("FAIL");
      if (id === "P8") expect(result).toContain("11 of 11");
      else expect(result).toMatch(/: OK/);
    });
  }
});
