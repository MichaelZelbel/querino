// Finding H3: GitHub personal access tokens were stored in plain text.
//
// Phase 0 closed the browser half: Settings.tsx stopped selecting the token
// into the page just to decide whether to draw bullets. This is the other
// half. The value now lives in Supabase Vault, the column it used to sit in is
// write-only and empty, and only the service role can decrypt it, which means
// only an edge function can.
//
// What these check, in order of how much they would cost to get wrong:
//
//   * no row holds a readable token any more
//   * a logged-in user cannot select the column at all, even their own
//   * the things Settings.tsx actually does still work
//   * an edge function can still read a token, because a GitHub sync that
//     silently stops working is the obvious way to "fix" this badly

import { test, expect } from "@playwright/test";
import { restAsService, restAsUser, sqlProbe } from "./helpers/api";

test.describe("H3 — a stored credential is not readable from the table", () => {
  test("no credential row carries a plaintext value", async () => {
    const res = await restAsService<Array<{ id: string; credential_value: string | null }>>(
      "user_credentials?select=id,credential_value,credential_secret_id",
    );
    expect(res.ok, `could not read the credentials table: ${JSON.stringify(res.error)}`).toBe(true);

    for (const row of res.data ?? []) {
      expect(
        row.credential_value,
        `credential ${row.id} still holds its secret in the table`,
      ).toBeNull();
    }
  });

  test("every credential points at a Vault secret", async () => {
    const res = await restAsService<Array<{ id: string; credential_secret_id: string | null }>>(
      "user_credentials?select=id,credential_secret_id",
    );
    for (const row of res.data ?? []) {
      expect(
        row.credential_secret_id,
        `credential ${row.id} has no secret anywhere, so whatever uses it is quietly broken`,
      ).not.toBeNull();
    }
  });

  test("a logged-in user cannot select the column, even on their own row", async () => {
    const res = await restAsUser("user_credentials?select=id,credential_value");
    expect(
      res.ok,
      "credential_value is still selectable by a browser session, which is the whole finding",
    ).toBe(false);
    expect(res.status).toBe(403);
  });

  test("what the Settings page does still works", async () => {
    // It selects the id and nothing else, to decide whether to draw bullets.
    const res = await restAsUser("user_credentials?select=id&credential_type=eq.github_token");
    expect(res.ok, `Settings can no longer tell whether a token is set: ${JSON.stringify(res.error)}`).toBe(
      true,
    );
  });

  test("only the service role can decrypt a credential", async () => {
    const res = await restAsUser("rpc/read_user_credential", {
      method: "POST",
      body: { _credential_type: "github_token" },
    });
    expect(
      res.status,
      "a logged-in user could decrypt a stored credential",
    ).toBe(403);
  });

  test("an edge function can still read a token, and writing one still round-trips", async () => {
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        u uuid;
        v_id uuid;
        v_secret uuid;
        log text := '';
      BEGIN
        SELECT c.user_id INTO u FROM public.user_credentials c WHERE c.team_id IS NULL LIMIT 1;
        IF u IS NULL THEN
          RAISE EXCEPTION 'PROBE SKIP no personal credential exists to check';
        END IF;

        IF length(public.read_user_credential('github_token', u, NULL)) IS NULL THEN
          RAISE EXCEPTION 'PROBE FAILED an existing token no longer decrypts';
        END IF;
        log := log || 'existing token decrypts; ';

        INSERT INTO public.user_credentials (user_id, credential_type, credential_value, team_id)
        VALUES (u, 'h3_suite_probe', 'ghp_written_by_the_suite', NULL)
        RETURNING id, credential_secret_id INTO v_id, v_secret;

        IF (SELECT credential_value FROM public.user_credentials WHERE id = v_id) IS NOT NULL THEN
          RAISE EXCEPTION 'PROBE FAILED a written credential stayed in the column: %', log;
        END IF;
        IF v_secret IS NULL THEN
          RAISE EXCEPTION 'PROBE FAILED a written credential went nowhere: %', log;
        END IF;
        IF public.read_user_credential('h3_suite_probe', u, NULL) <> 'ghp_written_by_the_suite' THEN
          RAISE EXCEPTION 'PROBE FAILED a written credential does not read back: %', log;
        END IF;
        log := log || 'a new token is encrypted on write and reads back; ';

        DELETE FROM public.user_credentials WHERE id = v_id;
        IF EXISTS (SELECT 1 FROM vault.secrets WHERE id = v_secret) THEN
          RAISE EXCEPTION 'PROBE FAILED deleting the credential left the secret behind: %', log;
        END IF;
        log := log || 'deleting the row deletes the secret';

        RAISE EXCEPTION 'PROBE OK %', log;
      END $probe$;
    `);

    expect(out, `the credential round trip is broken: ${out}`).toContain("PROBE OK");
  });
});
