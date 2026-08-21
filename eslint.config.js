import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
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
    // `npm run lint` now exits 0 with a clean error list. What stops the any
    // count creeping back up is scripts/lint-ratchet.mjs, not this file: it
    // records the count and fails CI if it rises.
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
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
);
