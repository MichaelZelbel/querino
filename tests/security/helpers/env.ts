// Configuration for the security test suite.
//
// NOTHING SECRET LIVES IN THIS FILE. The repository is public. Every secret is
// read from the environment; the anon key below is already published in
// src/integrations/supabase/client.ts and in every visitor's browser bundle,
// which is precisely why it is not a credential (see finding H1).

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Load tests/.env.test (gitignored) if present. Real env vars always win. */
function loadDotEnvTest(): void {
  const path = resolve(process.cwd(), ".env.test");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnvTest();

export const PROJECT_REF = process.env.QUERINO_PROJECT_REF ?? "zvuwkffneqxqsihlnfsd";
export const SUPABASE_URL = process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
export const REST_URL = `${SUPABASE_URL}/rest/v1`;

/** Public by design. Shipped in the browser bundle. Not a credential. */
export const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dXdrZmZuZXF4cXNpaGxuZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzY4MzEsImV4cCI6MjA4MDM1MjgzMX0.dpFIy0U_FO8Spj7V9jgKqjGUoakwFVCfNJ_8HuaYFTc";

/**
 * The shared secret machine callers present as X-Internal-Key (Phase 1).
 * Optional: while it is unset the suite still asserts that unauthenticated
 * callers are refused, it just cannot also assert that authorised ones pass.
 */
export const INTERNAL_JOB_SECRET = process.env.INTERNAL_JOB_SECRET ?? "";

export const TEST_USER_EMAIL = process.env.QUERINO_TEST_EMAIL ?? "";
export const TEST_USER_PASSWORD = process.env.QUERINO_TEST_PASSWORD ?? "";

const MISSING_CREDS = `
The security suite needs a service-role key and a non-admin test account.

  SUPABASE_SERVICE_ROLE_KEY   or   SUPABASE_ACCESS_TOKEN (the key is then read
                                   from the Supabase Management API)
  QUERINO_TEST_EMAIL
  QUERINO_TEST_PASSWORD

Put them in the environment or in a gitignored .env.test at the repo root.
`.trim();

let serviceKeyPromise: Promise<string> | null = null;

/**
 * The service-role key. Either supplied directly, or fetched once per run from
 * the Management API using a personal access token, so a machine that already
 * holds SUPABASE_ACCESS_TOKEN needs no second secret.
 */
export function serviceRoleKey(): Promise<string> {
  const direct = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (direct) return Promise.resolve(direct);

  if (!serviceKeyPromise) {
    const pat = process.env.SUPABASE_ACCESS_TOKEN;
    if (!pat) return Promise.reject(new Error(MISSING_CREDS));

    serviceKeyPromise = (async () => {
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`,
        { headers: { Authorization: `Bearer ${pat}` } },
      );
      if (!res.ok) {
        throw new Error(
          `Could not read project API keys from the Management API (${res.status}). ${MISSING_CREDS}`,
        );
      }
      const keys = (await res.json()) as Array<{ name: string; api_key: string }>;
      const key = keys.find((k) => k.name === "service_role")?.api_key;
      if (!key) throw new Error(`No service_role key on project ${PROJECT_REF}.`);
      return key;
    })();
  }
  return serviceKeyPromise;
}

export function requireTestUser(): { email: string; password: string } {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) throw new Error(MISSING_CREDS);
  return { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD };
}
