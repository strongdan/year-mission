# Year Mission — Cloudflare Workers migration

Last updated: 2026-09-02

## Decision

Target Cloudflare Workers using **vinext**, while keeping the current Next.js/Vercel path available until parity and rollback are proven.

Cloudflare's current Next.js guidance recommends vinext for existing Next.js 16 applications. vinext remains beta, so production cutover is gated on a compatibility check and real flow qualification rather than assumed compatibility.

## Repository preparation

Run:

```bash
pnpm cloudflare:check
```

The command pins the compatibility assessment to `vinext@1.0.0-beta.8`, the version current when this migration lane was created. Do not run `vinext init` until the compatibility report has been reviewed because `init` intentionally modifies package metadata, installs Vite/Cloudflare dependencies, and generates deployment configuration.

After a passing/reviewed compatibility report:

```bash
pnpx vinext@1.0.0-beta.8 init
```

Select **Cloudflare Workers** when prompted. Keep the generated vinext/Vite files alongside the existing Next.js path so rollback remains possible.

## Required pre-cutover qualification

The Cloudflare preview must pass all of these before DNS/custom-domain cutover:

1. Google sign-in.
2. Apple sign-in.
3. Supabase authenticated server components and server actions.
4. Google Tasks connect, reconnect, disconnect, and two-way sync.
5. Google Calendar read-only context.
6. AI Coach with primary provider and forced fallback-provider failure.
7. Journal save, AI analysis, and explicit task promotion.
8. Money/finance read-only sync paths that are configured.
9. PWA manifest, service worker, installability, and offline shell.
10. iPhone Safari and installed-PWA smoke checks.
11. Existing lint, typecheck, unit-test, and production-build suites.

## OAuth and origin changes

Before preview qualification, add the Cloudflare preview hostname to the appropriate allowlists/redirect configuration for:

- Supabase Auth Site URL / Redirect URLs
- Google OAuth redirect URI for Year Mission account login
- Google Tasks/Calendar OAuth redirect URI
- Apple Services ID / web return URL

Do not remove the Vercel return URLs until the rollback window is closed.

## Secrets

Configure server-side values as Cloudflare Worker secrets/variables. At minimum review:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Google OAuth state/encryption keys used by this repository
- `INTEGRATION_SECRETS_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- any configured finance-provider credentials

Never commit secret values to Wrangler configuration.

## Cutover sequence

```text
vinext check
  -> review compatibility gaps
  -> vinext init on migration branch
  -> local Workers-runtime preview
  -> non-production workers.dev deployment
  -> OAuth allowlist updates
  -> parity qualification
  -> rollback rehearsal to Vercel
  -> custom-domain cutover
  -> stabilization window
  -> disable unnecessary Vercel builds
  -> retire Vercel only after rollback is no longer required
```

## Current blocker

Repository preparation can be completed without production authority. A real Workers preview/deployment and custom-domain cutover require Cloudflare account authorization/API credentials and provider-console changes for OAuth return URLs. Those are operational dependencies, not reasons to weaken test coverage or guess at a successful deployment.
