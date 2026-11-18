// Tests for scripts/floating-imports.mjs, run by `npm run test:scripts`.
// scripts/deno-check.mjs refuses to count while one of these is found.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  floatingMapEntries,
  floatingSpecifiers,
} from "../../scripts/floating-imports.mjs";

test("an exact release is pinned", () => {
  const source = `
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";
    import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
    import slugify from "npm:transliteration@2.3.5";
    import { x } from "jsr:@std/assert@1.0.0-rc.1/mod.ts";
    const m = await import('https://esm.sh/tslib@2.8.1?target=denonext');
  `;
  assert.deepEqual(floatingSpecifiers(source), []);
});

test("a major, a range, a tag or no version floats", () => {
  const source = `
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
    import { Hono } from "jsr:@hono/hono@^4";
    export { y } from "npm:mcp-lite@latest";
    import "https://esm.sh/zod";
    const m = await import("npm:@scope/pkg@2.x/sub");
  `;
  assert.deepEqual(floatingSpecifiers(source), [
    "https://esm.sh/@supabase/supabase-js@2",
    "jsr:@hono/hono@^4",
    "npm:mcp-lite@latest",
    "https://esm.sh/zod",
    "npm:@scope/pkg@2.x/sub",
  ]);
});

test("a URL that is not an import is ignored", () => {
  const source = `const docs = "https://esm.sh/@supabase/supabase-js@2";`;
  assert.deepEqual(floatingSpecifiers(source), []);
});

test("an import map in deno.json is judged the same way", () => {
  const denoJson = JSON.stringify({
    imports: {
      hono: "jsr:@hono/hono@^4",
      "@supabase/supabase-js": "npm:@supabase/supabase-js@2",
      "mcp-lite": "npm:mcp-lite@0.10.0",
      "@std/": "https://deno.land/std@0.168.0/",
      lib: "../_shared/lib.ts",
    },
  });
  assert.deepEqual(floatingMapEntries(denoJson), [
    "jsr:@hono/hono@^4",
    "npm:@supabase/supabase-js@2",
  ]);
});
