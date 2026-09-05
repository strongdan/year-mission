# Year Mission — ROADMAP.md

Last updated: 2026-09-04

> [!NOTE]
> All P0 recovery items **YM-RM-001** through **YM-RM-010** (Google connection idempotency, Google invalid_grant recovery, Sign in with Apple, AI provider pool & failover, Cloudflare cutover, Seasonal visual identity, Night Shift, Today journaling with AI reflection, and read-only Plaid banking integration) have been fully implemented, tested, merged into `main` via PR #34, applied in Supabase production (`0013_journal.sql`, `0014_plaid_finance.sql`), and deployed to Cloudflare Workers (`https://year-mission.dangaston.workers.dev`). See `docs/BACKLOG_RECOVERY_STATUS.md` for details.


## Purpose

This file is the owner-prioritized delivery queue for Year Mission.

It complements the product rules in `SPEC.md`, `DECISIONS.md`, `VISION.md`, `IDEAS.md`, and `AGENTS.md`. It does not weaken the 30-day feature-freeze discipline: production defects, auth failures, security issues, data-integrity problems, and cost/reliability remediation may be fixed during the freeze; larger feature additions remain queued until deliberately promoted into active implementation.

Status labels:

- `ACTIVE` — implementation or activation already underway
- `NEXT` — high-priority work to take after current active work / remediation
- `QUEUED` — accepted roadmap work, not yet active
- `DONE-CODE / ACTIVATE` — code has landed, but production/provider activation or smoke qualification remains

---

# P0 — Reliability and broken-flow remediation

## YM-RM-001 — Make Google connection persistence idempotent

**Status:** `NEXT`

Current user-visible failure:

```text
duplicate key value violates unique constraint "google_connections_user_id_key"
```

Goal:

A user must be able to connect or reconnect Google Tasks repeatedly without creating duplicate connection rows or surfacing a database constraint error.

Implementation requirements:

- Preserve the invariant of at most one `google_connections` row per `user_id`.
- Audit every write path to `google_connections`, including the Google OAuth callback and repository helpers.
- Make reconnect semantics explicitly idempotent: update/replace the existing user's connection rather than attempting an accidental second insert.
- Verify the database constraint/index matches the conflict target used by application code.
- Make concurrent callbacks/retries safe.
- Do not expose raw database errors to the user.
- Add regression coverage for initial connect, reconnect, repeated callback, and concurrent/retried callback behavior.

Acceptance criteria:

- First Google connection succeeds.
- Reconnecting the same Year Mission user succeeds.
- Replaying/retrying the persistence step does not create a second row and does not raise the unique-constraint error.
- Exactly one canonical Google connection remains for the user.

---

## YM-RM-002 — Recover cleanly from expired/revoked Google OAuth grants

**Status:** `NEXT`

Current user-visible failure:

```text
google token exchange failed (400): {
  "error": "invalid_grant",
  "error_description": "token has been expired or revoked"
}
```

Goal:

Expired, revoked, reused, or otherwise invalid Google grants must become a recoverable reconnect state rather than a dead-end error.

Implementation requirements:

- Distinguish `invalid_grant` from generic OAuth/network failures.
- Treat an invalid refresh grant as a disconnected/re-auth-required Google connection.
- Clear or quarantine unusable stored credentials when appropriate so Year Mission does not repeatedly retry a known-bad token.
- Present a concise `Reconnect Google` action.
- Verify authorization codes are exchanged only once and that the callback redirect URI exactly matches the URI used to obtain the code.
- Preserve Google connection diagnostics without leaking tokens or secrets.
- Add tests for revoked refresh token, expired/reused authorization code, reconnect success, and a subsequent successful Tasks sync.

Acceptance criteria:

- `invalid_grant` never strands the user in a repeated failure loop.
- The UI clearly offers reconnection.
- Reauthorization restores Google Tasks sync without manual database cleanup.

---

# P1 — Authentication, AI resilience, and infrastructure cost

## YM-RM-003 — Finish Sign in with Apple activation

**Status:** `DONE-CODE / ACTIVATE`

The Sign in with Apple implementation has landed in the repository. Remaining roadmap work is operational qualification.

Requirements:

- Enable/configure the Apple provider in the production Supabase project.
- Configure the Apple Developer identifiers, key, redirect URLs, and private-key handling without committing secrets.
- Verify Sign in with Apple in Safari and the installed iPhone PWA.
- Verify existing Google-login users are not accidentally split into duplicate Year Mission identities when Apple uses the same or a private-relay email.
- Document recovery/account-linking behavior for provider changes.

Acceptance criteria:

- Apple sign-in works in production on iPhone Safari and installed PWA.
- Login failures are actionable and provider-neutral where appropriate.
- No auth secret is exposed client-side or committed to Git.

---

## YM-RM-004 — Expand the free/zero-cost AI model pool

**Status:** `NEXT`

Goal:

Reduce AI operating cost and dependence on any single paid model while keeping coaching quality acceptable.

Requirements:

- Keep a provider/model registry behind the existing AI abstraction.
- Add additional credible free, zero-cost, promotional-credit, or very-low-cost models where they meet privacy, latency, and reliability requirements.
- Classify models by job rather than treating every model as interchangeable: parsing/classification, summarization, journaling analysis, task decomposition, and coaching/reasoning.
- Maintain capability metadata such as context limits, structured-output support, latency, cost, and known failure modes.
- Prefer the cheapest adequate model for each job.
- Do not couple domain logic to any single vendor or model identifier.

Acceptance criteria:

- Multiple providers/models can be enabled by configuration.
- At least one low/no-cost path exists for routine AI work when available.
- The application records which provider/model served each AI request.

---

## YM-RM-005 — Implement automatic AI fallback and failover

**Status:** `NEXT`

Goal:

AI features should degrade gracefully when a model is unavailable, rate-limited, times out, produces invalid structured output, or otherwise fails.

Requirements:

- Define ordered fallback chains per AI job.
- Retry only when the failure class is retryable; do not create retry storms.
- Fall through to the next eligible model/provider on timeout, rate-limit, provider outage, malformed structured output, or configured quality/compatibility failure.
- Use bounded timeouts and a total request budget.
- Preserve the rule that AI failure never mutates user data.
- Record provider/model attempts, latency, failure class, and final provider used.
- Add a temporary health/circuit-breaker mechanism so a repeatedly failing model is skipped for a cooling period.
- Provide a deterministic/non-AI fallback wherever the app can still complete the user flow safely.

Acceptance criteria:

- A simulated primary-model failure automatically exercises the next configured model.
- AI outages do not corrupt application state.
- Users receive a useful degraded experience instead of a raw provider error whenever possible.

---

## YM-RM-006 — Migrate Year Mission hosting from Vercel to Cloudflare

**Status:** `NEXT`

Goal:

Reduce recurring hosting/build cost while preserving application behavior and a safe rollback path.

Requirements:

- Establish a non-production Cloudflare deployment first.
- Choose the appropriate supported Cloudflare runtime for the current Next.js application and document any framework/runtime incompatibilities.
- Preserve Supabase auth/database behavior, OAuth callbacks, PWA/service-worker behavior, server routes, AI calls, and Google Tasks integration.
- Configure environment variables/secrets, caching, headers, CSP/security headers, SPA/navigation behavior, and custom-domain routing.
- Update Google, Apple, and Supabase redirect/allowed-origin configuration for the Cloudflare hostname before production cutover.
- Compare production-critical flows against the existing Vercel deployment.
- Rehearse rollback before DNS cutover.
- Stop unnecessary Vercel builds once Cloudflare has qualified; retain Vercel only as a temporary rollback path until the stabilization window closes.
- Update repository documentation so Cloudflare becomes the canonical hosting target after cutover.

Qualification flows:

- Google login
- Apple login
- Google Tasks connect/reconnect/sync
- AI Coach and fallback chain
- task CRUD and Today flow
- journaling once implemented
- installed iPhone PWA behavior
- offline shell/static asset behavior

Acceptance criteria:

- Cloudflare reaches functional parity for production-critical paths.
- Rollback is tested before cutover.
- Vercel build/hosting cost is eliminated or materially reduced after stabilization.

---

# P1 — Experience improvements

## YM-RM-007 — Give each season a restrained visual identity

**Status:** `QUEUED`

Goal:

Make the current season instantly recognizable without turning Year Mission into a loud or game-like UI.

Requirements:

- Assign each season a distinct, restrained accent palette.
- Apply the accent consistently to season indicators and a small number of high-value surfaces rather than recoloring the entire application.
- Preserve the calm/adult design language.
- Meet WCAG contrast requirements.
- Never encode state or meaning by color alone.
- Support both normal and Night Shift appearance.
- Keep season names/dates configurable; do not couple behavior to a particular hard-coded color.

Acceptance criteria:

- The current season is visually recognizable at a glance.
- All season variants remain accessible and legible.

---

## YM-RM-008 — Implement Night Shift

**Status:** `QUEUED`

Goal:

Provide a low-stimulation evening experience that is comfortable on an iPhone at night without changing the underlying planning semantics.

Initial interpretation:

- time-aware or manually selectable Night Shift appearance
- darker, warmer, lower-glare surfaces
- reduced nonessential visual emphasis/animation
- preserve full accessibility and readable contrast

Requirements:

- Allow explicit user override; never trap the user in an automatic appearance mode.
- Persist the preference.
- Define behavior for system dark mode versus Year Mission Night Shift.
- Ensure seasonal accent colors have Night Shift-safe variants.
- Do not make Night Shift a separate task mode or change Momentum/score calculations merely because it is nighttime.

Acceptance criteria:

- Night Shift works cleanly on iPhone Safari and installed PWA.
- All primary flows remain legible and usable in low-light conditions.

---

## YM-RM-009 — Add home-screen journaling with optional AI analysis

**Status:** `QUEUED`

Goal:

Make brief reflection available directly from the home/Today surface without turning Year Mission into a journaling obligation.

Requirements:

- Add a compact `Journal` / `Quick reflection` entry point on the home/Today screen.
- Keep manual writing useful without AI.
- Allow optional AI analysis after an entry is saved.
- AI analysis may identify themes, blockers, mood/energy context expressed in the text, repeated friction, decisions, and possible next actions, but it should avoid false certainty or pseudo-diagnostic claims.
- Prefer actionable synthesis over generic motivational prose.
- Let the user explicitly promote a suggested next action into a task; analysis itself must not mutate task state.
- Keep journal entries private/user-owned under RLS.
- Do not send unrelated historical data to the model; construct a bounded context packet when longitudinal analysis is requested.
- Add controls to disable AI analysis and to remove entries.

Acceptance criteria:

- A journal entry can be captured from Today in a few seconds.
- AI analysis is optional and failure-safe.
- Any task/action derived from an entry requires explicit user confirmation before mutation.

---

# P2 — Financial data integration

## YM-RM-010 — Add real read-only banking integration

**Status:** `QUEUED`

Goal:

Replace purely manual financial snapshots with optional real account/balance/transaction data so the Money domain can reflect actual financial movement.

Product boundary:

- Start read-only.
- Do not add payment initiation, transfers, credit applications, or autonomous financial actions in the first banking phase.
- User remains in control of categorization and any action derived from financial data.

Provider-selection requirements:

- Prefer a secure, supported no-cost/free-tier solution if one is genuinely viable for the required institutions and usage volume.
- It is acceptable to combine services if that materially improves coverage while preserving a coherent abstraction.
- Do not use credential scraping or an insecure workaround merely to achieve a nominally free integration.
- If no credible fully free production option exists, document the lowest-cost safe alternative and expected monthly cost before activation.
- Keep provider-specific account/token semantics behind a banking integration boundary.

Initial data scope:

- account metadata
- current/available balances where supported
- posted transactions
- normalized merchant/description
- transaction date
- amount
- account identity/reference
- sync timestamps and provider diagnostics

Money-domain uses:

- debt/balance progress
- cash-flow awareness
- recurring-spend visibility
- evidence for weekly Money review
- AI-assisted summaries only after deterministic calculations are available

Security/reliability requirements:

- Encrypt provider access/refresh tokens at rest.
- Never expose banking credentials/tokens client-side.
- Use least-privilege scopes.
- Provide disconnect/delete-data controls.
- Make sync idempotent and duplicate-safe.
- Preserve raw provenance needed to reconcile provider updates without treating AI classification as authoritative ledger data.

Acceptance criteria:

- A user can connect a supported account and retrieve read-only financial data.
- Repeat synchronization does not duplicate transactions.
- Disconnect/reconnect is recoverable.
- Money progress can consume normalized banking data without making the app capable of moving funds.

Note: this roadmap item intentionally revisits the older V1 non-goal of financial account aggregation. Do not silently implement against the old constraint; when work becomes active, update `SPEC.md`/`DECISIONS.md` to record the new owner decision and exact scope.

---

# Recommended execution order

1. `YM-RM-001` Google connection unique-constraint remediation.
2. `YM-RM-002` `invalid_grant` recovery and reconnect UX.
3. `YM-RM-003` production activation/smoke qualification for Sign in with Apple.
4. `YM-RM-004` expand the low/no-cost AI model registry.
5. `YM-RM-005` AI fallback/circuit-breaker behavior.
6. `YM-RM-006` Cloudflare pilot, parity qualification, rollback rehearsal, then cutover.
7. `YM-RM-007` seasonal color identities.
8. `YM-RM-008` Night Shift.
9. `YM-RM-009` home-screen journaling + optional AI analysis.
10. `YM-RM-010` read-only banking integration after a provider/security/cost selection spike.

The ordering is intentional: repair broken external integrations first, then improve AI resilience and hosting cost, then add UX breadth and financial connectivity.
