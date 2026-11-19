// When an artifact first went public is the database's word, not the
// client's (issue #66, migration 20261119160000). The stamp_published_at
// trigger is the only thing that sets published_at on prompts, skills,
// workflows and prompt kits; /rss.xml dates and orders by it. One SQL probe
// acts as an author and as the MCP server, inside a transaction that is
// always rolled back, and reports one line per rule.
//
// now() is fixed for the whole transaction, so "stamped now" and "kept the
// old date" are told apart by starting from a row that went public over a
// day ago.
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
  v_old uuid; v_author uuid; v_was timestamptz;
  v_priv uuid; v_skill uuid; v_skill_author uuid;
  v_new uuid; v_ts timestamptz;
BEGIN
  SELECT p.id, p.author_id, p.published_at INTO v_old, v_author, v_was
    FROM public.prompts p
   WHERE p.is_public AND p.published_at < now() - interval '1 day'
     AND p.team_id IS NULL AND p.author_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_suspensions s WHERE s.user_id = p.author_id AND s.suspended)
   ORDER BY p.created_at, p.id LIMIT 1;
  SELECT p.id INTO v_priv FROM public.prompts p
   WHERE NOT p.is_public AND p.published_at IS NULL AND p.author_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_suspensions s WHERE s.user_id = p.author_id AND s.suspended)
   ORDER BY p.created_at, p.id LIMIT 1;
  SELECT k.id, k.author_id INTO v_skill, v_skill_author FROM public.skills k
   WHERE NOT k.published AND k.published_at IS NULL
     AND k.team_id IS NULL AND k.author_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_suspensions s WHERE s.user_id = k.author_id AND s.suspended)
   ORDER BY k.created_at, k.id LIMIT 1;

  IF v_old IS NULL OR v_priv IS NULL OR v_skill IS NULL THEN
    RAISE EXCEPTION 'PROBE SKIP needs a prompt public for over a day, a private prompt and a private personal skill';
  END IF;

  -- D1: an author publishing a skill gets now(), whatever date they send
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_skill_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.skills SET published = true, published_at = '2099-01-01' WHERE id = v_skill;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.skills WHERE id = v_skill;
  log := log || format(E'\nD1 author publishes a skill dated 2099: %s (%s)',
    CASE WHEN v_ts = now() THEN 'OK' ELSE 'FAIL' END, v_ts);

  -- D2: the MCP server (service role) publishing a prompt gets now()
  SET LOCAL ROLE service_role;
  UPDATE public.prompts SET is_public = true WHERE id = v_priv;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.prompts WHERE id = v_priv;
  log := log || format(E'\nD2 service role publishes a prompt: %s (%s)',
    CASE WHEN v_ts = now() THEN 'OK' ELSE 'FAIL' END, v_ts);

  -- D3: an edit keeps the date
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET title = title || ' (probe)' WHERE id = v_old;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.prompts WHERE id = v_old;
  log := log || format(E'\nD3 author edits a public prompt: %s (%s)',
    CASE WHEN v_ts = v_was THEN 'OK' ELSE 'FAIL' END, v_ts);

  -- D4: a forged date on update is ignored
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET published_at = '2099-01-01' WHERE id = v_old;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.prompts WHERE id = v_old;
  log := log || format(E'\nD4 author dates own prompt 2099: %s (%s)',
    CASE WHEN v_ts = v_was THEN 'OK' ELSE 'FAIL' END, v_ts);

  -- D5: unpublishing and republishing keeps the first date
  SET LOCAL ROLE authenticated;
  UPDATE public.prompts SET is_public = false WHERE id = v_old;
  UPDATE public.prompts SET is_public = true WHERE id = v_old;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.prompts WHERE id = v_old;
  log := log || format(E'\nD5 unpublish and republish: %s (%s)',
    CASE WHEN v_ts = v_was THEN 'OK' ELSE 'FAIL' END, v_ts);

  -- D6: a forged date on insert is ignored, private and public
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_skill_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.skills (title, content, author_id, published, published_at)
  VALUES ('probe skill', 'probe', v_skill_author, false, '2000-01-01') RETURNING id INTO v_new;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.skills WHERE id = v_new;
  log := log || format(E'\nD6a private skill inserted dated 2000: %s (%s)',
    CASE WHEN v_ts IS NULL THEN 'OK' ELSE 'FAIL' END, v_ts);
  SET LOCAL ROLE service_role;
  INSERT INTO public.prompts (title, description, content, category, author_id, is_public, published_at)
  VALUES ('probe prompt', 'probe', 'probe', 'writing', v_author, true, '2099-01-01') RETURNING id INTO v_new;
  RESET ROLE;
  SELECT published_at INTO v_ts FROM public.prompts WHERE id = v_new;
  log := log || format(E'\nD6b public prompt inserted dated 2099: %s (%s)',
    CASE WHEN v_ts = now() THEN 'OK' ELSE 'FAIL' END, v_ts);

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
  [
    "D1",
    "an author publishing a skill is dated now, not by the date they send",
  ],
  ["D2", "a prompt the MCP server publishes is dated now"],
  ["D3", "an edit keeps the date an item went public"],
  ["D4", "an author cannot date their own prompt into the future"],
  ["D5", "unpublishing and republishing keeps the first date"],
  ["D6a", "a private item inserted with a date has none"],
  ["D6b", "a public item inserted with a date is dated now"],
];

test.describe("When an item went public is the database's word", () => {
  for (const [id, title] of CASES) {
    test(title, async () => {
      test.skip(!hasManagementToken(), NEEDS_TOKEN);
      const result = await line(id);
      expect(result, result).not.toContain("FAIL");
      expect(result).toMatch(/: OK/);
    });
  }
});
