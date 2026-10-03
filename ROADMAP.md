# Year Mission — ROADMAP.md

Last updated: 2026-10-01

> [!NOTE]
> The original P0 recovery program was implemented and deployed. Later owner decisions supersede historical feature choices: Sign in with Apple is now retired from the user-facing product, while Apple Health / HealthKit remains separate and supported. See `docs/BACKLOG_RECOVERY_STATUS.md` and the current reconciliation issue for present-state authority.


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

## YM-RM-003 — Sign in with Apple

**Status:** `RETIRED`

Apple OAuth was previously implemented and qualified, but a later owner decision removes it from the user-facing login surface. Do not reintroduce Apple sign-in without a new explicit owner decision. This retirement does **not** remove Apple Health / HealthKit integration.

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
- Update Google and Supabase redirect/allowed-origin configuration for the Cloudflare hostname before production cutover.
- Compare production-critical flows against the existing Vercel deployment.
- Rehearse rollback before DNS cutover.
- Stop unnecessary Vercel builds once Cloudflare has qualified; retain Vercel only as a temporary rollback path until the stabilization window closes.
- Update repository documentation so Cloudflare becomes the canonical hosting target after cutover.

Qualification flows:

- Google login
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

# P1 — Guided daily execution

## YM-RM-011 — Morning briefing, evening reset, and avoidance-aware follow-through

**Status:** `QUEUED`

**Owner request captured:** 2026-10-01. Accepted for roadmap planning, not implementation or deployment authorization. Promote the exact scope into `SPEC.md` and record changed decisions before implementation; retain the feature-freeze and reliability-first rules.

Goal:

Make Year Mission useful even when the user does not remember to maintain a task list. The app should help recall uncaptured responsibilities, bring back established commitments, and turn forgotten, uninteresting, unclear, or uncomfortable work into a manageable next action. The core loop is: show up, hear what matters, start something, and close the loop.

### Product boundaries and integration

- Make the check-in the time-appropriate entry experience within **Today**, not a new primary tab, adventure dashboard, or separate task database. Keep direct access to Today/Now; never require a check-in before doing a task.
- Reuse the current task flow, deterministic sequencing, task events, execution mode, Floor behavior, Coach, and Momentum where they already work. Audit live code before claiming any component exists or is complete.
- Propose at most **three meaningful actions** in the briefing and emphasize **one Now action**. This is a presentation limit, not a change to the existing five-task Today capacity. New commitments still require an explicit capacity tradeoff.
- Distinguish suggestions from commitments. Confirm new task promotions and schedule changes; previously approved recurring responsibilities may recur according to their confirmed rules. Do not silently promote Inbox/backlog items.
- The core must work with existing/manual task data and without AI, banking integration (`YM-RM-010`), or new Calendar/email access. Optional source context must be explicitly authorized and expose unavailable/stale states rather than invent obligations or availability.

### Morning briefing and short routine checklist

- Aim for a roughly two-minute interaction: orient to the current day, surface genuine time-sensitive responsibilities and mission/Weekly Win progress, then recommend a concrete first move with a short deterministic `Why this?` explanation.
- Include a compact, user-approved routine checklist. Establish recurrence once, allow easy edits/pause, and account for routine workload rather than hiding unlimited work outside the Today limit.
- Do not enforce three actions or fixed category quotas when fewer are appropriate. Empty days, low-energy days, and Recovery/Maintenance modes must remain useful.
- End with `Start this now`, leading to the existing execution flow or the relevant safe destination. Example: `Open the document and find its due date`, not `Sort out all your paperwork`.
- Keep actual deadlines distinct from preferred work dates. Explain conflicts with available time and preserve visibility of critical obligations without turning Today into an overdue wall.

### Avoidance support: change the approach, not the notification volume

- Offer `I'm avoiding this` as a direct entry to the existing friction/anti-avoidance flow; do not require emotional analysis, a journal entry, or a diagnostic label.
- Offer a two-minute starting attempt, a smaller physical next step, clarification, or help. Distinguish `Forgot`, `Not important`, `Blocked`, `Don't know how`, `No energy`, and `Just avoiding it`; not every unfinished task is fear-based.
- After repeated explicit deferrals (initial proposed threshold: two), offer a different strategy: resize, clarify, choose a realistic time, record a blocker, request support, or explicitly park/drop an optional item. Do not endlessly reissue the same reminder or force a particular choice.
- A support option may help draft a request or plan a shared work session; it must not contact another person or book anything without explicit approval.
- Record `started`, `resized`, `deferred`, and `completed` separately. Starting a difficult task is evidence of progress, not proof that the underlying responsibility is finished.
- Preserve deferral history and true deadlines. Snoozing, missing a check-in, or completing a tiny first step must not erase an obligation, move its due date, or imply completion. An unopened notification alone is not proof of avoidance.

### Evening reset and remembering uncaptured work

- Aim for two to three minutes: resolve the outcome of today's selected actions, capture anything new, and briefly orient to tomorrow. Allow skip and resume without losing confirmed work.
- Offer a plain text field compatible with device dictation from the first usable version. A later optional short voice-capture flow may propose tasks for review; no required metadata entry or lengthy conversation.
- Rotate one concrete recall prompt at a time, such as `Did you promise anyone something?`, `Any mail or messages needing a response?`, or `Anything around the house you noticed but have not handled?` Let users skip or dismiss irrelevant prompts.
- Review extracted task titles, due dates, and proposed changes before applying them. Uncertain dates stay uncertain until clarified; new captures default to Inbox, not automatic Today commitments. Preserve original input when parsing fails.
- Reuse optional quick reflection/journaling (`YM-RM-009`) rather than making duplicate records or a second mandatory journal. A brief `something good today` reflection remains optional.
- Recaps must be grounded in saved outcomes. Recognize meaningful effort, completed responsibilities, and mission progress without fabricated praise or treating app use as accomplishment.

### Reminders, missed days, and the twenty-second fallback

- Offer one morning and one evening reminder in user-chosen local time windows after opt-in. Midday is optional and off by default; use it only for a specifically requested check or action, not a third mandatory routine.
- Reuse the existing notification mechanism where supported. Qualify actual delivery on supported iPhone surfaces; do not assume the app can reliably notify in the background. Keep an in-app fallback when permission, delivery, or platform support is unavailable.
- Respect timezone changes, daylight-saving transitions, quiet hours, pause/disable settings, and per-check-in deduplication. Do not deliver both morning and evening catch-up notifications when reconnecting.
- Supply a twenty-second path with one meaningful action and `Start`, `Choose a time`, or `Need help`. Check-in completion must not become a new chore or block direct task execution.
- After absence, show the current day, not a stack of missed briefings or duplicate routine instances. Keep outstanding real commitments accessible; missed check-ins neither erase tasks nor silently re-promote the whole backlog.
- No lost progress, broken-streak penalties, shame copy, fake XP, or rewards for notification opens/check-in volume. Use existing meaningful milestones and evidence; light mission language must not introduce another game system.

### Privacy, reliability, and agent boundaries

- Keep task/reflection content private under existing user isolation. Notifications should use generic copy by default; do not expose sensitive task details on the lock screen or put raw notes/transcripts in analytics, logs, or public fixtures.
- Application code owns all mutations. Validate AI proposals, require appropriate confirmation, and make retries, repeated taps, and recurrence creation idempotent.
- AI/network failure must preserve drafts and confirmed state. Stale recommendations must be revalidated before mutation; a task completed elsewhere must not be resurrected.
- For optional in-app audio, define explicit microphone consent, transcription-provider disclosure, retention/deletion, and a non-audio fallback before activation. No ambient recording or emotion/health inference. Do not change the separate no-microphone rule for Conversation Confidence speaking practice.

### Delivery slices

- [ ] **011-A — Reconcile and admit scope:** inventory existing Today, friction, recurrence, capture, notification, and review behavior; identify reusable pieces and gaps; update `SPEC.md`/`DECISIONS.md` for the selected slice before any runtime/schema work. Keep unrelated open work and production behavior intact.
- [ ] **011-B — Small complete daily loop:** deliver morning/evening Today entry, short routines, text/device-dictation capture with confirmation, concrete Now action, the avoidance pathway, outcome tracking, opt-in reminder controls with capability fallback, and twenty-second/missed-day recovery. Keep ranking and the core workflow deterministic.
- [ ] **011-C — Evidence-led refinements:** add consented in-app voice transcription only if device dictation is insufficient; tune recall prompts and deferral adaptation from real use; qualify optional action-specific midday reminders. Do not make these refinements prerequisites for using 011-B.

### Acceptance criteria and test coverage

- [ ] A morning check-in produces no more than three proposed actions, emphasizes one Now action, respects Today capacity/routine workload, and allows starting without completing a briefing.
- [ ] Established routine rules generate each occurrence once; retries, reopen, and simultaneous devices do not duplicate tasks or confirmations.
- [ ] The evening flow captures an otherwise unrecorded responsibility, previews its interpretation, and saves it only after confirmation; no arbitrary date or active commitment is invented.
- [ ] Two explicit deferrals offer changed assistance while preserving history/deadlines. A two-minute attempt records a start without completing the parent task; a genuine blocker is not treated as unwillingness.
- [ ] After three missed days, the app returns to the current briefing with important commitments intact, no catch-up pile, and no Momentum/streak penalty. The short path remains usable.
- [ ] Notification tests cover disabled/denied permission, unsupported delivery, quiet hours, timezone/DST changes, duplicate delivery/taps, paused reminders, and midday remaining off unless enabled. Sensitive task content is absent by default.
- [ ] Failure/concurrency tests cover AI timeout or malformed proposals, ambiguous dictation, microphone denial, offline capture/reconnect, expired authentication, interrupted check-ins, rapid taps, and tasks changed/completed on another device. No draft loss, unauthorized writes, or task resurrection.
- [ ] Mobile/accessibility checks cover iPhone browser/installed surfaces actually supported by the release, touch targets, keyboard/screen-reader operation, readable low-light appearance, and direct access to Now.
- [ ] Agent-run end-to-end scenarios use fictional seeded data and isolated test accounts: mundane recurring work, an uncaptured promise, repeated avoidance, an unimportant item explicitly dropped, a real deadline conflict, an empty/low-energy day, interrupted capture, and return after absence. Agents may not access real accounts or contact people as a test.
- [ ] Evaluate a short real-use pilot on responsibilities actually surfaced/handled, ease of starting, maintenance burden, and ease of returning after a miss—not session length, check-in streaks, task creation volume, or fabricated progress. Record observations before further scope expansion.

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
3. `YM-RM-004` expand the low/no-cost AI model registry.
4. `YM-RM-005` AI fallback/circuit-breaker behavior.
5. `YM-RM-006` Cloudflare pilot, parity qualification, rollback rehearsal, then cutover.
6. `YM-RM-011` guided daily execution, after deliberate scope promotion: morning briefing, evening reset, avoidance support, and missed-day recovery; refine from real use.
7. `YM-RM-007` seasonal color identities.
8. `YM-RM-008` Night Shift.
9. `YM-RM-009` home-screen journaling + optional AI analysis; share capture/reflection components with `YM-RM-011` rather than duplicate them.
10. `YM-RM-010` read-only banking integration after a provider/security/cost selection spike.

The ordering is intentional: repair broken external integrations first, then improve AI resilience and hosting cost, then reduce daily execution friction before adding cosmetic breadth and financial connectivity. `YM-RM-011` remains queued until explicitly promoted; its placement does not reopen completed recovery work or authorize production changes.
