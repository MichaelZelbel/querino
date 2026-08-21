# Security test suite

Seven checks over the things that cost money or leak data. They are deliberately
small: this is not coverage, it is a tripwire on the parts of Querino where a
mistake is expensive and silent.

Every test talks to the **deployed** project over HTTPS, as an outsider would.
Nothing is mocked and nothing reads the local source, so a green run means the
running system behaves, not that the code reads well.

## Running them

```bash
cp .env.test.example .env.test     # fill it in, it is gitignored
npm test
```

`npm test` and `npm run test:security` are the same thing. The suite lives in its
own `playwright.security.config.ts`, separate from `playwright.config.ts`, which
is Lovable's browser harness and needs a package that only exists inside
Lovable's sandbox.

## What it needs

| Variable | Why |
|---|---|
| `SUPABASE_ACCESS_TOKEN` **or** `SUPABASE_SERVICE_ROLE_KEY` | setup and teardown, and to read balances the tests then assert on. With the access token the suite fetches the service-role key from the Management API itself. |
| `QUERINO_TEST_EMAIL`, `QUERINO_TEST_PASSWORD` | a non-admin account. Several tests are "a normal user must not be able to…", which needs a normal user. |
| `INTERNAL_JOB_SECRET` | optional until Phase 1 ships. Without it the suite still checks that strangers are refused; it just skips checking that the real jobs are let through. |

## What it touches

Only the test account, and it puts everything back:

- moves that account's `tokens_used` to zero-remaining and restores it
- writes and deletes `llm_usage_events` rows keyed to a per-run idempotency key
- creates and deletes one private prompt, and one MCP token that expires in an hour

It never writes another user's rows. It does not create accounts, because a
profile insert fires `notify_admin_on_signup` and mails a real person.

`ensure-token-allowance`'s `batch_init` positive control runs a real batch
provisioning pass. That is idempotent and is what the nightly job does anyway.

## Reading a failure

A red test here is a statement about production, not about the suite.

| File | Finding | Green when |
|---|---|---|
| `01-batch-init-requires-a-machine-key` | C1 | Phase 0 (shipped) |
| `02-force-tokens-needs-an-admin` | C2 | Phase 0 (shipped) |
| `03-plan-type-is-not-self-service` | C3 | Phase 0 (shipped) |
| `04-job-endpoints-require-the-internal-key` | H1 | **Phase 1** |
| `05-search-survives-punctuation` | M2 | when the filter input is escaped |
| `06-no-credits-means-402` | the credit gate | now, and it must stay green through Phase 2 |
| `07-idempotent-charging` | double charging | now, and it must stay green through Phase 2 |

Files 04 and 05 are expected to fail until those fixes land. That is the point of
writing them first.

## The rule these tests exist to enforce

An edge function never reads an identity from a request body. It derives it from
the JWT with `getCallerUserId`, or it is a machine endpoint and requires
`X-Internal-Key`. There is no third option.

C1, C2 and H2 were all the same mistake.
