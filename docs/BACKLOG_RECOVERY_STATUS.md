# Year Mission Backlog Recovery Status

Updated: 2026-09-04

This document reconciles the original roadmap with the production state after the Cloudflare cutover. It intentionally supersedes stale status labels in `ROADMAP.md` until that larger roadmap is rewritten.

## Completed before this recovery branch

- **YM-RM-003 — Sign in with Apple:** DONE. Apple OAuth is implemented through Supabase Auth and was production-qualified during the Cloudflare cutover, including Safari and the installed iPhone PWA.
- **YM-RM-006 — Cloudflare migration:** DONE. Cloudflare Workers + vinext is canonical at `https://year-mission.dangaston.workers.dev`; Vercel is rollback-only with routine autobuilds disabled.

## Implemented on `feat/backlog-recovery`

- **YM-RM-001 — Google connection idempotency:** explicit `user_id` upsert conflict target through an admin-only Google connection store; active connect/reconnect paths no longer rely on an ambiguous default upsert.
- **YM-RM-002 — Google `invalid_grant` recovery:** typed OAuth errors, safe error parsing, central invalid-credential clearing, and consistent reconnect guidance across Tasks, Calendar, task hub, and OAuth callback flows.
- **YM-RM-004 — AI provider pool:** adds OpenRouter's zero-cost router and Groq GPT-OSS support in addition to Gemini and OpenAI. Cost metadata must remain aligned with current provider pricing.
- **YM-RM-005 — AI fallback/failover:** bounded per-provider timeouts, sequential fallback, short circuit cooldown after provider failures, duplicate-provider suppression, and a friendly exhausted-provider error.

The Settings surface exposes configured fallback order and supports encrypted per-device API keys for Gemini, OpenRouter, Groq, and OpenAI. Brain Dump audio transcription remains intentionally limited to Gemini/OpenAI until the other providers have an explicitly supported audio path.

## Still queued after this slice

- **YM-RM-007 — Seasonal visual identity**
- **YM-RM-008 — Night Shift**
- **YM-RM-009 — Home-screen journaling with optional AI analysis**
- **YM-RM-010 — Read-only banking integration**

The implementation in stale PR #24 should continue to be treated as source material only. Do not merge it wholesale over the current Cloudflare/gamification main branch.
