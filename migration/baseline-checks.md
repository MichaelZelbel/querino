# Baseline checks — eb0650d on prep/tanstack-migration

Recorded before any preparation change. node v22.19.0, npm 10.9.3.

## npm run build
```
[2mdist/[22m[36massets/SkillEdit-C8nB-GgB.js                     [39m[1m[2m 13.67 kB[22m[1m[22m[2m │ gzip:   4.69 kB[22m
[2mdist/[22m[36massets/WorkflowEdit-Bycc5b46.js                  [39m[1m[2m 14.32 kB[22m[1m[22m[2m │ gzip:   4.87 kB[22m
[2mdist/[22m[36massets/WorkflowDetail-ywW1DWfO.js                [39m[1m[2m 15.40 kB[22m[1m[22m[2m │ gzip:   5.34 kB[22m
[2mdist/[22m[36massets/VersionHistoryPanel-DTqcrKxY.js           [39m[1m[2m 15.50 kB[22m[1m[22m[2m │ gzip:   4.04 kB[22m
[2mdist/[22m[36massets/PromptKitEdit-h_D7nobU.js                 [39m[1m[2m 15.59 kB[22m[1m[22m[2m │ gzip:   5.36 kB[22m
[2mdist/[22m[36massets/PromptKitDetail-BGq7ER-3.js               [39m[1m[2m 16.96 kB[22m[1m[22m[2m │ gzip:   5.49 kB[22m
[2mdist/[22m[36massets/select-OvP3aWYV.js                        [39m[1m[2m 21.31 kB[22m[1m[22m[2m │ gzip:   7.50 kB[22m
[2mdist/[22m[36massets/Terms-D0DkeoO5.js                         [39m[1m[2m 21.74 kB[22m[1m[22m[2m │ gzip:   6.04 kB[22m
[2mdist/[22m[36massets/PromptDetail-OkVBaVyM.js                  [39m[1m[2m 23.06 kB[22m[1m[22m[2m │ gzip:   7.14 kB[22m
[2mdist/[22m[36massets/LibraryPromptEdit-8ccC2TZl.js             [39m[1m[2m 26.29 kB[22m[1m[22m[2m │ gzip:   7.60 kB[22m
[2mdist/[22m[36massets/Library-C-DatcK1.js                       [39m[1m[2m 30.94 kB[22m[1m[22m[2m │ gzip:   9.34 kB[22m
[2mdist/[22m[36massets/Privacy-DNJRI7B8.js                       [39m[1m[2m 34.44 kB[22m[1m[22m[2m │ gzip:   8.24 kB[22m
[2mdist/[22m[36massets/Admin-DArqNv2n.js                         [39m[1m[2m 38.92 kB[22m[1m[22m[2m │ gzip:  10.60 kB[22m
[2mdist/[22m[36massets/MenerioSyncButton-U7qCP0LS.js             [39m[1m[2m 45.77 kB[22m[1m[22m[2m │ gzip:  12.20 kB[22m
[2mdist/[22m[36massets/Docs-DsxPr6t8.js                          [39m[1m[2m 50.47 kB[22m[1m[22m[2m │ gzip:  12.77 kB[22m
[2mdist/[22m[36massets/Settings-vLHv45p4.js                      [39m[1m[2m 57.94 kB[22m[1m[22m[2m │ gzip:  16.43 kB[22m
[2mdist/[22m[36massets/index-BcGBN01W.js                         [39m[1m[2m117.39 kB[22m[1m[22m[2m │ gzip:  36.05 kB[22m
[2mdist/[22m[36massets/PromptKitRichEditor-DLbFh_WZ.js           [39m[1m[33m577.61 kB[39m[22m[2m │ gzip: 195.79 kB[22m
[2mdist/[22m[36massets/index-CsRcSb9F.js                         [39m[1m[33m830.42 kB[39m[22m[2m │ gzip: 242.98 kB[22m
[33m
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 8.09s[39m
```

## npx tsc --noEmit (current, loose settings)
```
exit=0
```

## npm run lint
```
   64:67  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  290:27  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  293:34  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\hub\dev\querino\supabase\functions\github-sync\index.ts
  772:42  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  785:42  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\hub\dev\querino\supabase\functions\mcp-server\index.ts
  1056:30  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\hub\dev\querino\supabase\functions\process-menerio-sync-queue\index.ts
  122:16  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  123:9   warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  175:16  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  176:9   warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  211:59  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 233 problems (0 errors, 233 warnings)

```

## npm test (security suite, HTTP against the deployed project)
```
  ok 131 tests\security\21-the-usage-view-is-admin-only.spec.ts:103:3 › the AI usage view answers the question it was built for › an admin gets every call site back, dormant ones included (352ms)
  ok 132 tests\security\21-the-usage-view-is-admin-only.spec.ts:124:3 › the AI usage view answers the question it was built for › the ledger's own history is not lost to a null feature column (327ms)


  1) tests\security\19-a-call-site-uses-its-configured-model.spec.ts:62:3 › a call site uses its configured model › the ledger records the configured model, not the code default 

    Error: suggest-metadata failed: {"error":"Rate limit exceeded, please retry shortly."}

    [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

    Expected: [32m200[39m
    Received: [31m429[39m

      102 |       );
      103 |     }
    > 104 |     expect(res.status, `suggest-metadata failed: ${JSON.stringify(res.body)}`).toBe(200);
          |                                                                                ^
      105 |
      106 |     const rows = await sqlQuery<UsageRow>(
      107 |       `SELECT model, provider, metadata FROM llm_usage_events
        at C:\hub\dev\querino\tests\security\19-a-call-site-uses-its-configured-model.spec.ts:104:80

  1 failed
    tests\security\19-a-call-site-uses-its-configured-model.spec.ts:62:3 › a call site uses its configured model › the ledger records the configured model, not the code default 
  131 passed (1.1m)
```
