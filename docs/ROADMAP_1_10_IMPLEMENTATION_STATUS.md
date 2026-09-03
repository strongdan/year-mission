# Year Mission — Roadmap 1–10 implementation status

Date: 2026-09-02
Branch: `feat/roadmap-1-10-implementation`

This document records what was implemented for the ten owner-prioritized roadmap items and, where repository work alone cannot finish activation, the exact remaining dependency. The rule for this pass was: implement safely, document any blocker, and continue to the next item.

## 1. Google connection duplicate-key failure

**Repository implementation: COMPLETE — qualification pending CI/live reconnect smoke**

Failure targeted:

```text
duplicate key value violates unique constraint "google_connections_user_id_key"
```

Implemented:

- one canonical Google connection per `user_id` remains enforced by the database;
- all active server write paths now use an explicit `user_id` conflict target when an insert-or-update is intended;
- credential clearing/disconnect is update-only and cannot accidentally create a second row;
- callback and shared sync helpers use the same connection-store semantics;
- regression coverage exercises reconnect-oriented token classification.

Live qualification still required after deployment: connect → reconnect → repeat callback/sync and confirm one row remains.

## 2. Google `invalid_grant` recovery

**Repository implementation: COMPLETE — qualification pending live revoked-token smoke**

Failure targeted:

```text
google token exchange failed (400): invalid_grant / token expired or revoked
```

Implemented:

- typed `GoogleOAuthError` captures status/code/description without leaking raw provider bodies;
- `invalid_grant` is classified as reconnect-required rather than a generic failure;
- unusable stored Google credentials are cleared to prevent an infinite retry loop;
- Tasks/Calendar surfaces return a concise reconnect instruction;
- callback, task hub, and sync service share the same classifier;
- tests distinguish reconnect errors from ordinary rate-limit/service errors.

## 3. Sign in with Apple

**Code: ALREADY LANDED BEFORE THIS PASS**
**Operational activation: BLOCKED ON PROVIDER CONFIGURATION**

The repository already contains Sign in with Apple through Supabase Auth. This pass updated Settings copy so Apple and Google are represented consistently.

Remaining external work:

- Apple Developer Services ID / key configuration;
- production Supabase Apple provider activation;
- exact production/Cloudflare return URLs;
- Safari + installed iPhone PWA real OAuth smoke;
- verify account identity behavior for Apple private-relay email / existing Google user.

No Apple private key or client secret should be committed to the repository.

## 4. More free AI models

**Repository implementation: COMPLETE — provider keys/limits remain operational configuration**

Added provider paths behind the existing abstraction:

- Gemini
- OpenRouter free router (`openrouter/free`)
- Groq GPT-OSS endpoints
- OpenAI paid fallback

Settings can securely store/test/select keys for all four providers. Deployment-level keys are also supported. Provider/model/cost metadata remains available to AI callers.

Free-tier availability and limits are provider policy, not a Year Mission guarantee; the app treats them as configurable paths rather than hard-coded entitlement.

## 5. Automatic AI fallback

**Repository implementation: COMPLETE — qualification pending CI and forced-failure smoke**

Implemented:

- ordered per-request provider chain;
- free-tier-first default order unless the user chooses another first provider;
- bounded 15-second timeout per provider;
- short circuit-breaker cooldown after failure;
- automatic next-provider attempt;
- friendly exhausted-provider error;
- no AI failure can directly mutate user data;
- unit tests cover first-provider failure, circuit skipping, and total exhaustion.

Before production promotion, force the first provider to fail and verify the second provider serves the Coach successfully.

## 6. Cloudflare migration

**Repository preparation: COMPLETE**
**Actual Workers deployment/cutover: BLOCKED ON CLOUDFLARE + OAUTH CONSOLE AUTHORITY**

Implemented:

- `pnpm cloudflare:check` runs pinned `vinext` compatibility assessment;
- `docs/CLOUDFLARE_MIGRATION.md` defines compatibility review, non-production deployment, OAuth updates, parity tests, rollback rehearsal, cutover, stabilization, and Vercel retirement;
- Settings diagnostics recognize Cloudflare build metadata where available.

Not performed from this branch:

- `vinext init` (intentionally deferred until compatibility output is reviewed because it mutates project/dependencies/config);
- real Workers deployment;
- custom-domain/DNS cutover;
- OAuth console mutations.

Those actions require Cloudflare/provider account authorization and should occur only after CI and compatibility checks pass.

## 7. Color each season

**Repository implementation: COMPLETE — visual/accessibility qualification pending preview**

Implemented:

- season identity derives from the actual active plan's configured season dates and sequence;
- no hard-coded month-to-color behavior;
- four restrained accent slots cycle safely for configurable seasons;
- a subtle two-pixel top marker reinforces the active season;
- color is decorative only; the season name remains the semantic indicator;
- Night Shift has compatible season-accent variants;
- failure to load season data is enhancement-only and cannot block the app.

Preview qualification should verify contrast and season transitions in Light, Dark, and Night Shift.

## 8. Night Shift

**Repository implementation: COMPLETE — visual/PWA qualification pending preview**

Implemented:

- persistent third appearance mode: `night`;
- warm low-glare background, foreground, border, placeholder, hover, and legacy zinc utility mappings;
- pre-hydration theme bootstrap prevents a theme flash;
- PWA theme color updates with the selected appearance;
- explicit user selection/override;
- reduced-motion safeguards.

Night Shift changes appearance only; it does not alter task priority, Momentum, Reliability, or other execution semantics.

## 9. Home-screen journal + optional AI analysis

**Repository implementation: COMPLETE — database migration + UI/AI qualification pending**

Added migration `0013_journal.sql` with user-scoped RLS and AI provenance fields.

Today now includes Quick reflection with:

- save without AI;
- Save & analyze;
- analyze a saved entry later;
- concise execution-oriented AI reflection;
- optional single suggested next action;
- explicit `Add to Inbox` promotion;
- delete entry;
- provider/model/token/cost/latency provenance.

Safety boundary:

- AI analysis itself cannot create/reschedule/complete a task;
- the user must explicitly promote a suggested action;
- prompt guidance prohibits diagnostic/pseudo-clinical claims and requires grounding in the journal text.

Operational dependency: apply `0013_journal.sql` to the target Supabase environment before enabling the UI there.

## 10. Real read-only banking integration

**Repository implementation: COMPLETE for Plaid + existing fallbacks**
**Production activation: BLOCKED ON PLAID CREDENTIALS/REDIRECT REGISTRATION + LIVE BANK SMOKE**

The repository already had:

- normalized finance accounts/transactions/liabilities;
- SimpleFIN integration;
- Actual CLI/import bridge;
- manual unsupported liabilities.

This pass adds Plaid as the preferred free-plan-capable read-only path:

- migration `0014_plaid_finance.sql`;
- encrypted permanent Plaid access-token storage in a service-role-only table;
- Plaid Link token creation;
- web/PWA Link launch;
- OAuth redirect resume;
- public-token exchange for new Items;
- cursor-based `/transactions/sync` incremental reconciliation;
- removed-transaction handling;
- account/balance normalization;
- optional credit-card/student-loan/mortgage liabilities;
- update-mode reconnect;
- per-connection/all-connection sync;
- Item disconnect/revocation;
- separate imported-data deletion;
- Settings UI;
- normalized finance schema/test support for `plaid`.

Security boundary:

- no payment initiation or transfers;
- no bank username/password storage;
- Plaid permanent tokens are encrypted server-side;
- no normal user RLS SELECT/INSERT/UPDATE policy exposes `finance_connections` credentials;
- service-role operations authenticate first and explicitly scope `user_id`;
- normalized finance data remains in the existing RLS-protected finance hub.

Operational dependencies:

1. Plaid account/plan eligibility;
2. `PLAID_CLIENT_ID` + correct environment secret;
3. exact redirect URI registered with Plaid;
4. `INTEGRATION_SECRETS_KEY` configured;
5. migrations `0013` and `0014` applied;
6. real institution connect/sync/reconnect/disconnect smoke.

SimpleFIN and Actual remain fallbacks; the new integration does not remove them.

---

# Required qualification before merge/deploy

Repository CI must pass:

```text
pnpm install --frozen-lockfile
pnpm lint --max-warnings=0
pnpm typecheck
pnpm test
pnpm build
```

Then run deployment-specific qualification for the features that depend on external providers:

- Google connect/reconnect and a deliberately revoked grant;
- Apple OAuth in Safari + installed PWA;
- forced AI primary-provider failure/fallback;
- Night Shift/season visual accessibility;
- journal migration/save/analyze/promote/delete;
- Plaid sandbox first, then real read-only Production Item if plan/credentials permit;
- `pnpm cloudflare:check`, then Workers preview/parity/rollback before any production cutover.
