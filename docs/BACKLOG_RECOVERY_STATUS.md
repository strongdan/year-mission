# Year Mission Backlog Recovery Status

Updated: 2026-09-04

This document reconciles the original roadmap with the production state after the Cloudflare cutover. It intentionally supersedes stale status labels in `ROADMAP.md` until that larger roadmap is rewritten.

## Completed

- **YM-RM-001 — Google connection idempotency:** explicit `user_id` upsert conflict target through an admin-only Google connection store; active connect/reconnect paths no longer rely on an ambiguous default upsert.
- **YM-RM-002 — Google `invalid_grant` recovery:** typed OAuth errors, safe error parsing, central invalid-credential clearing, and consistent reconnect guidance across Tasks, Calendar, task hub, and OAuth callback flows.
- **YM-RM-003 — Sign in with Apple:** DONE. Apple OAuth is implemented through Supabase Auth and was production-qualified during the Cloudflare cutover, including Safari and the installed iPhone PWA.
- **YM-RM-004 — AI provider pool:** Gemini, OpenRouter's zero-cost router, Groq GPT-OSS, and OpenAI are supported. Cost metadata must remain aligned with current provider pricing.
- **YM-RM-005 — AI fallback/failover:** bounded per-provider timeouts, sequential fallback, short circuit cooldown after provider failures, duplicate-provider suppression, and a friendly exhausted-provider error.
- **YM-RM-006 — Cloudflare migration:** DONE. Cloudflare Workers + vinext is canonical at `https://year-mission.dangaston.workers.dev`; Vercel is rollback-only with routine autobuilds disabled.
- **YM-RM-007 — Seasonal visual identity:** DONE. The active mission season sets a restrained authenticated-app accent and remains enhancement-only/fail-open.
- **YM-RM-008 — Night Shift:** DONE. Light, Dark, and warm low-glare Night themes persist on-device and bootstrap before paint.
- **YM-RM-009 — Home-screen journaling with optional AI analysis:** DONE in repository. The owner-isolated journal schema, Today quick reflection, optional AI analysis with provenance, safe output degradation, and explicit Add-to-Inbox promotion are merged. Production use still requires applying `0013_journal.sql` to the target Supabase project.

The Settings surface exposes configured AI fallback order and supports encrypted per-device API keys for Gemini, OpenRouter, Groq, and OpenAI. Brain Dump audio transcription remains intentionally limited to Gemini/OpenAI until the other providers have an explicitly supported audio path.

## Implemented in `feat/plaid-readonly-banking`

- **YM-RM-010 — Read-only banking integration:** Plaid Sandbox/Production Link flow, encrypted service-role-only access-token storage, cursor-based Transactions sync, optional Liabilities ingestion, reconnect/update mode, disconnect, imported-data deletion, and coexistence with SimpleFIN/Actual/manual finance sources.

Plaid remains **not activated in production** until `0014_plaid_finance.sql` is applied, Plaid credentials/redirects are configured, and Sandbox then real-data read-only smoke tests pass.

The implementation in stale PR #24 should continue to be treated as source material only. Do not merge it wholesale over the current Cloudflare/gamification main branch.
