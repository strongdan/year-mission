# Year Mission UI / Release Reconciliation — 2026-09-25

Issue: #66

This document is the authoritative reconciliation snapshot for recent owner requests versus production/main. It exists to prevent stale pull requests and historical decisions from masquerading as current release intent.

## Requested vs live

| Request / capability | Current status | Authority / next action |
| --- | --- | --- |
| Mission Charge gamification | LIVE | Merged through PR #26; keep current restrained daily charge/comeback/bonus-mission loop unless separately changed. |
| Remove seed / plant progress visuals | IN CLEANUP | Branch `cleanup/ui-release-reconciliation` replaces Mission Garden plants and Seed/Sprout/Growing/Rooted/Flourishing labels with simple durable-evidence bars. |
| Remove Sign in with Apple | IN CLEANUP | Branch `cleanup/ui-release-reconciliation` removes Apple login UI/copy and retires Apple-auth docs. Apple Health / HealthKit remains supported and separate. |
| Conversation Confidence | LIVE | PRs #55, #57, #60. |
| Life Balance + Apple Health / HealthKit | LIVE | PR #59; atomic partial-sync semantics retained. |
| Gratitude / everyday good / small wins | BACKLOG | Issue #61. |
| One Skill to Enjoy This Year | BACKLOG | Issue #62. |
| Movement breaks | BACKLOG | Issue #65. |
| Adventure presentation | OWNER DECISION | Issue #67. Old stacked PRs #50/#51 are closed; rebuild from current main only if chosen. |
| Coming Up anticipation planner | BACKLOG / EXTRACT FRESH | Issue #68. Old PR #44 closed. |
| Credit score progress | BACKLOG / EXTRACT FRESH | Issue #69. Old PR #40 closed. |
| Lab progress scan | BACKLOG / EXTRACT FRESH | Issue #70. Old PR #41 closed. |
| Actionable maintenance reminders | BACKLOG / EXTRACT FRESH | Issue #71. Old PR #47 closed. |
| Daily check-in reminder suppression | BACKLOG / SMALL FIX | Issue #72. Old PR #45 closed. |
| Brain Dump transcription error hardening | BACKLOG / SMALL FIX | Issue #73. Old PR #18 closed. |
| Movement variety nudges | DEFERRED / RECONCILE WITH LIFE BALANCE | Old PR #48 closed. Reconsider only after Life Balance + #65 have real-use evidence. |
| Review workspace / Decision Log bundle | NOT CURRENTLY PROMOTED | Old PR #46 closed. Recover individual pieces only by new owner decision; Decision Log remains outside current V1 scope. |

## PR audit disposition

Closed during this reconciliation:

- #53 — broad consolidation: superseded as a merge vehicle.
- #51 / #50 — Adventure stack: stale; decision moved to #67.
- #49 — Life Balance predecessor: superseded by merged #59.
- #48 — movement variety: stale/deferred; reconcile with current Life Balance and #65 later.
- #47 — actionable reminders: fresh extraction tracked in #71.
- #46 — mixed review workspace: not currently promoted.
- #45 — check-in reminder suppression: fresh extraction tracked in #72.
- #44 — Coming Up: fresh extraction tracked in #68.
- #41 — lab scan: fresh extraction tracked in #70.
- #40 — credit score: fresh extraction tracked in #69.
- #21 — seasonal/category momentum predecessor: superseded by later focused work.
- #18 — Brain Dump error hardening: fresh extraction tracked in #73.
- #2 — old HealthKit/ChatGPT/adaptive-missions architecture: superseded by current HealthKit and AI/Coach architecture.

No stale diverged PR should be merged directly into `main`. Salvage useful behavior by rebuilding from current `main` in a focused PR.

## Cleanup decision: Mission Garden

Mission Garden is retired as a user-facing metaphor.

Keep:
- Mission Charge;
- comeback recognition;
- optional bonus mission;
- Big Four weekly balance;
- durable evidence of meaningful actions and returns after gaps.

Remove:
- plant drawings;
- seed/sprout/growing/rooted/flourishing labels;
- language implying progress is a garden that needs tending.

The replacement should remain calm and compact: domain label, durable score/progress bar, meaningful-action count, and comeback count when relevant.

## Cleanup decision: Apple login vs Apple Health

These are separate systems.

Retire:
- Continue with Apple login button;
- Apple-login account copy;
- Apple-auth setup/qualification documentation as a current product requirement.

Keep:
- Apple Health / HealthKit read-only integration;
- native HealthKit bridge;
- AASA/native callback behavior required for the current Google/native handoff and HealthKit flows;
- Apple platform configuration needed for those non-auth capabilities.

Account-safety transition:
- the normal login surface is Google-only;
- until the Google identity is confirmed to reach the same existing Year Mission account/data, a temporary non-advertised recovery path remains at `/login?recovery=apple`;
- this recovery path is not part of normal navigation and exists only to prevent accidental lockout during provider retirement.

Post-merge operational follow-up:
- verify Google login in Safari/PWA/native flow and confirm the expected existing data;
- then remove the temporary `?recovery=apple` path and disable the Apple OAuth provider/configuration if desired;
- do not remove Apple Health entitlements or native associated-domain setup as part of auth cleanup.

## Release discipline

For this cleanup PR:
1. lint;
2. typecheck;
3. tests;
4. Next build;
5. vinext / Cloudflare preview;
6. fresh code review;
7. login + Progress smoke on preview/production as appropriate;
8. normal merge only.

After merge, production should be compared against this matrix before adding another visible feature.
