import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    // A linter that always fails is a linter nobody reads. Finding S3 of the
    // August 2026 audit: there were 215 errors, 209 of them no-explicit-any,
    // and the six that mattered were invisible in the noise. One of them was a
    // lucide-react icon named Infinity shadowing the global inside a module.
    //
    // So no-explicit-any is a warning, the six real errors are fixed, and
    // `npm run lint` exits 0 with a clean error list. What stops the any
    // count creeping back up is scripts/lint-ratchet.mjs, not this file: it
    // records the count and fails CI if it rises.
    //
    // Lovable's commit 45dcfa7 (2026-08-24) rewrote this file and dropped the
    // warning and the unused-directive check below. The ratchet counts the
    // rule whatever its severity, so CI stayed green while `npm run lint`
    // exited 1 with 162 errors, all of them `any`, which is the noise this
    // block exists to remove. Put back on 2026-10-07.
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Report an eslint-disable comment that no longer suppresses anything.
    // They accumulate around code that has since been fixed and then hide the
    // next real problem in the same place.
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  eslintPluginPrettier,
);
