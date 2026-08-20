# Year Mission

A small, private, mobile-first personal execution tool.

> Do the right things, in the right order, long enough for meaningful change to occur.

The app helps you answer, in seconds:

- What matters now?
- What should I ignore?
- What is the next physical action?
- Why am I avoiding something?
- Am I actually moving forward?

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- Supabase (PostgreSQL, Auth, Row Level Security)
- Serwist PWA with offline application shell
- Server-driven AI coach (deterministic sequencing; AI never writes to the database directly)
- Vitest for unit tests
- Tailwind CSS

Product decisions live in `SPEC.md`, `DECISIONS.md`, `VISION.md`, and `IDEAS.md`. `SPEC.md` is authoritative.

## Local development

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Local Supabase (optional, for real data):

```bash
supabase start      # local stack on 127.0.0.1:54321
supabase migration up
```

Copy `.env.example` to `.env.local` and fill in the values. `NEXT_PUBLIC_*` values are safe for the browser; server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, Google Tasks secrets) must never be exposed to the client.

Useful commands:

```bash
pnpm lint          # eslint (CI fails on warnings)
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest run
pnpm build         # production build
```

## Product overview

Four primary screens (only these, per `SPEC.md`):

- **Today** — current direction, the one recommended next action ("What Should I Do?"), Weekly Win, and an actionable Minimum Day floor.
- **Tasks** — `Inbox → This Week → Today → Done`, with deferral reasons and Google Tasks sync.
- **Progress** — momentum, reliability, key metrics, weekly review, career evidence, experiments.
- **Coach** — AI assistant grounded in stored state; proposed mutations go through a reviewable proposal before applying.

Today is intentionally capped at five tasks. Google Tasks is an interoperability layer only; Supabase stays canonical.

## Current stopping point

As of commit `d4f51da325a0f3a68b257156418c38fc8fae7cfa`, production auth has been aligned with the Supabase Next.js SSR cookie pattern:

- Browser login uses `createBrowserClient` from `@supabase/ssr`.
- The Next.js proxy uses a request-scoped SSR server client, refreshes via `auth.getClaims()`, and returns refreshed Supabase cookies/cache headers on the same response.
- `/login` and `/auth/callback` remain unauthenticated routes.
- `/auth/callback?code=...` exchanges the OAuth code and redirects to `/`.
- Login is Google-only; password signup/reset infrastructure is intentionally not present.
- Google Tasks OAuth was not changed.

Validation completed:

- Local: `pnpm lint`, `pnpm typecheck`, `pnpm test` (98 tests), `pnpm build`.
- GitHub Actions: CI run `32408843560`, `validate` job succeeded for `d4f51da325a0f3a68b257156418c38fc8fae7cfa`.
- Vercel Git deployment: `dpl_DYg8vkXQmFQq4ghyMnHPi9jm1njH`, `READY`.
- Production URL: `https://year-mission.vercel.app`.
- Production smoke: unauthenticated `/` redirects to `/login`, `/login` returns 200, `/auth/callback` remains public and surfaces a visible callback diagnostic when called without a code.

Not completed in this environment:

- Manual Google account sign-in verification. This requires an interactive browser/account session.

Before considering normal Google login fully verified in production, confirm in Supabase:

- Google provider is enabled.
- Site URL is `https://year-mission.vercel.app`.
- Redirect URL allowlist includes `https://year-mission.vercel.app/auth/callback` and any custom production-domain callback URL.

## Deployment

### 1. Vercel project

The repo is already linked to a Vercel project (`.vercel/project.json`).

Production deployment is owned by Vercel's native Git integration. Pushes to `main` create production deployments automatically through Vercel.

GitHub Actions is validation-only. `.github/workflows/ci.yml` runs:

- install with `pnpm install --frozen-lockfile`
- lint with zero warnings
- typecheck
- tests
- production build

Do not add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` as GitHub deployment secrets for this app unless the deployment ownership decision changes. Do not add replacement deployment credentials to GitHub Actions.

### 2. Environment variables

Set these in Vercel (Project → Settings → Environment Variables):

```text
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>        # server-only

# App URL (used for auth redirects)
NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app

# AI (optional; app works in mock mode without OPENAI_API_KEY)
OPENAI_API_KEY=sk-...
AI_DAILY_BUDGET_USD=0.5
AI_MONTHLY_BUDGET_USD=10
AI_MOCK_MODE=auto        # auto | force

# Google Tasks sync (optional)
GOOGLE_TASKS_CLIENT_ID=...
GOOGLE_TASKS_CLIENT_SECRET=...                      # server-only
GOOGLE_TASKS_REDIRECT_URI=https://<your-app>.vercel.app/auth/google-tasks/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=<32 random bytes, base64>  # server-only
```

Generate the encryption key with:

```bash
openssl rand -base64 32
```

### 3. Supabase hosted project

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies migrations 0001–0009
```

Then in the Supabase dashboard:

- **Authentication → Providers → Google:** enable and enter your Google OAuth client ID/secret.
- **Authentication → URL Configuration:** set Site URL to `https://<your-app>.vercel.app` and add `https://<your-app>.vercel.app/auth/callback` to Redirect URLs.
- **Row Level Security:** enabled on all tables via migration `0007_rls.sql`. Verify `google_connections` and `google_task_sync` policies after linking.

### 4. Google Cloud (for Tasks sync only)

- Create an OAuth 2.0 **Web client** in Google Cloud Console.
- Enable the `https://www.googleapis.com/auth/tasks` scope.
- Add `https://<your-app>.vercel.app/auth/google-tasks/callback` as an authorized redirect URI.
- Use those credentials for `GOOGLE_TASKS_CLIENT_ID/SECRET`.

### 5. Verify after deploying

- Sign in with Google.
- Add an inbox task, promote it to This Week → Today, complete it, and confirm it persists after reload.
- Visit `/tasks` — the Google Tasks card connects, syncs two ways, and reports conflicts.
- Add to home screen on iPhone (standalone PWA) and check the offline shell (`/~offline`).

## Production notes

- Security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) are set in `vercel.json`.
- The `/auth/*` proxy only exempts `/login` and `/auth/callback`; every other path (including the Google Tasks OAuth routes) requires a session.
- AI failure never mutates data: proposals are schema-validated and require approval before applying.
- `supabase/.temp` and `supabase/.branches` are local CLI artifacts and gitignored.

## Roadmap discipline

After the core loop works, the project follows a 30-day feature freeze (`AGENTS.md` §33). Observations go into `OBSERVATIONS.md`; features are not built during the freeze. Future ideas are promoted only with real evidence of repeated use.
