# Year Mission — Cloudflare Workers migration

Last updated: 2026-09-04

## Decision

Move Year Mission from Vercel to Cloudflare Workers using vinext. Keep the existing Vercel deployment available only as a rollback target until the Cloudflare deployment has passed production-critical smoke tests and a stabilization window.

The migration is intentionally isolated from feature work. Do not use the broad roadmap PR as the hosting cutover vehicle.

## Qualified repository state

Cloudflare qualification is pinned to `vinext@1.0.0-beta.9` for this migration.

The compatibility scan against stable `main` reported 88% compatibility:

- App Router recognized.
- 12 pages recognized.
- 2 layouts recognized.
- 11 route handlers recognized.
- `next/navigation`, `next/cache`, `next/server`, `next/link`, `server-only`, and `next/headers` supported.
- `next/font/google` is partially supported because fonts are loaded from the CDN rather than self-hosted at build time.
- `next/offline` is partially supported; offline retry behavior requires explicit PWA qualification.
- the only structural issue was missing `"type": "module"`; `vinext init` added it.

The generated Cloudflare Worker build passes in GitHub Actions after explicitly allowing the `workerd` dependency build script in the repository's pnpm supply-chain policy.

## Pilot configuration

The first pilot deliberately avoids adding Cloudflare KV data-cache or Cloudflare Images dependencies. The goal is hosting parity first, platform optimization second.

Generated configuration includes:

- `vite.config.ts`
- `wrangler.jsonc`
- vinext/Vite/Cloudflare dependencies and scripts
- `nodejs_compat`
- Worker assets from `dist/client`
- version metadata binding
- Cloudflare CDN cache adapter

Useful commands:

```bash
pnpm run dev:vinext
pnpm run build:vinext
pnpm run start:vinext
pnpm run deploy:vinext
```

## Environment and secrets

Before a live `workers.dev` deployment can be functionally qualified, copy the existing Year Mission runtime configuration into Cloudflare Worker variables/secrets. Review at least:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Google Tasks/Calendar OAuth client ID and client secret
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- AI provider keys that are intentionally environment-backed
- notification/VAPID secrets
- native Brain Dump ticket/signing secrets
- finance import/provider secrets if those paths are enabled

Never commit secret values to `wrangler.jsonc`.

For Cloudflare, set `NEXT_PUBLIC_APP_URL` explicitly to the candidate Cloudflare hostname. Do not rely on the Vercel-specific fallback in `src/services/google/config.ts`.

## OAuth and allowed URLs

For the Cloudflare candidate hostname, add—do not replace—the required return URLs in:

- Supabase Auth Site URL / redirect allowlist
- Google account-login OAuth configuration
- Google Tasks/Calendar OAuth redirect configuration
- Apple Services ID web return URLs

Retain the Vercel URLs during rollback qualification.

## Required parity smoke tests

Before declaring Cloudflare canonical:

1. public/login shell renders correctly
2. Google sign-in and Supabase callback
3. Apple sign-in and Supabase callback
4. authenticated Today/task CRUD
5. Google Tasks connect, reconnect, sync, and disconnect
6. Google Calendar read-only context
7. Coach/AI request path
8. Brain Dump typed capture and server transcription path
9. PWA manifest/service worker/installability
10. installed iPhone PWA navigation and offline shell
11. notifications where configured
12. finance read-only paths that are enabled
13. lint, typecheck, tests, Next.js build, and vinext Worker build

The `next/offline` compatibility warning makes the installed-PWA/offline tests a hard cutover gate rather than an optional check.

## Cutover sequence

1. Merge the repository migration configuration only after normal CI and Cloudflare Worker build pass.
2. Deploy to a non-production `workers.dev` hostname.
3. Configure Cloudflare secrets/variables.
4. Add the candidate hostname to Supabase/Google/Apple allowlists.
5. Run parity smoke tests against both Cloudflare and the existing Vercel deployment.
6. Rehearse rollback by confirming the Vercel deployment remains usable with the old callbacks still allowed.
7. Make Cloudflare canonical only after parity passes.
8. Stop unnecessary Vercel Git builds after Cloudflare stabilization.
9. Retire the Vercel project only when the rollback window is deliberately closed.

## Automated Deployments (Cloudflare Workers Builds)

Cloudflare Workers Builds is configured as the canonical automatic deployment authority for Year Mission.

- **Git Repository:** `strongdan/year-mission`
- **Production Branch:** `main`
- **Root Directory:** `/`
- **Build Command:** `pnpm run build:vinext`
- **Production Deploy Command:** `pnpm run deploy:vinext`
- **Preview Version Upload Command:** `pnpm exec wrangler versions upload --config dist/server/wrangler.json`
- **Build Caching:** Enabled
- **Branch Triggers:**
  - Production: `branch_includes=["main"]` -> runs build and deploys active Worker version
  - Preview: `branch_includes=["*"]`, `branch_excludes=["main"]` -> uploads preview Worker version without altering production
- **Supabase Migrations:** Strictly manual/gated (never auto-executed on deployment)
- **Vercel Rollback:** Autobuilds disabled (`VERCEL_AUTOBUILDS=OFF`); project remains available as manual rollback target (`https://year-mission.vercel.app`).

## Current status

Cloudflare Worker live deployment and validation are complete. Cloudflare Workers + vinext is canonical (`https://year-mission.dangaston.workers.dev`), and Vercel (`https://year-mission.vercel.app`) remains an active, tested rollback target.

### Production Deployment Metadata
- **Cloudflare Worker:** `year-mission`
- **Canonical Host:** `https://year-mission.dangaston.workers.dev`
- **Vercel Rollback Host:** `https://year-mission.vercel.app`
- **Rollback Status:** Active & Ready
- **Auto-Deploy Engine:** Cloudflare Workers Builds

