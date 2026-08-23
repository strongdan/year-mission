# HealthKit + ChatGPT integration

This slice implements the four health-integration phases without turning Year Mission into a medical-record store.

## Architecture

Apple Health remains the source for device wellness data. The iOS bridge sends only compact daily metrics (steps, sleep, optional weight) and workout summaries. Year Mission reuses `daily_checkins` and `workouts`; it does not ingest raw heart-rate samples, medical records, diagnoses, or other clinical data.

The adaptive engine compares the most recent 7 days with the prior 7 days. It can suggest `normal`, `maintenance`, or `recovery`, but the result is advisory and always has `requiresApproval: true`.

## Server configuration

Set three server-only environment variables in Vercel:

- `YEAR_MISSION_OWNER_USER_ID`: the Supabase auth/profile UUID for the owner.
- `YEAR_MISSION_HEALTH_SYNC_TOKEN`: a long random bearer token used only by the iOS HealthKit bridge.
- `YEAR_MISSION_CHATGPT_TOKEN`: a different long random bearer token used only by ChatGPT/GPT Actions/MCP.

`SUPABASE_SERVICE_ROLE_KEY` must already be configured. Never expose any of these values through `NEXT_PUBLIC_*` variables.

Generate tokens with a password manager or `openssl rand -hex 32`.

## Phase 1 — Apple Health sync

`POST /api/healthkit/sync` accepts:

```json
{
  "source": "healthkit",
  "daily": [
    { "date": "2026-08-22", "steps": 8500, "sleepHours": 7.2, "weightLb": 195.4 }
  ],
  "workouts": [
    {
      "id": "HealthKit-workout-uuid",
      "date": "2026-08-22",
      "type": "cycling",
      "durationMinutes": 32,
      "energyKcal": 210,
      "distanceMiles": 4.3
    }
  ]
}
```

Use `Authorization: Bearer <YEAR_MISSION_HEALTH_SYNC_TOKEN>`.

Steps and sleep update their automatic fields. HealthKit weight only fills a date whose existing check-in has no weight, preserving manual entry. Workouts are deduplicated by HealthKit UUID stored in `workouts.metadata`.

`ios/HealthKitBridge/HealthKitSyncService.swift` is a reference companion implementation. Add it to an iOS target, enable the HealthKit capability, add the required Health usage description to the app's Info.plist, and provide the production sync endpoint/token via secure app configuration. Do not hard-code the token in source control.

## Phase 2 — normalized summary

Authenticated Year Mission users can call `GET /api/health/summary`. The response contains two 7-day windows, latest available weight, changes between windows, and the adaptive recommendation. This compact summary is the interface consumed by Coach/ChatGPT rather than raw HealthKit samples.

## Phase 3 — ChatGPT

### Current Plus-friendly path: private Custom GPT + Actions

A ChatGPT subscription does not pay for OpenAI API calls made by Year Mission. To avoid model API usage in Year Mission, keep ChatGPT itself as the chat surface and let a private Custom GPT call these endpoints:

- `GET /api/integrations/chatgpt/context`
- `POST /api/integrations/chatgpt/proposals`

Copy `docs/chatgpt-actions-openapi.yaml`, replace `https://YOUR_YEAR_MISSION_HOST` with the deployed Year Mission origin, and configure the GPT Action authentication as an API key/Bearer token using `YEAR_MISSION_CHATGPT_TOKEN`. Keep the GPT private because this is a single-owner integration.

This design causes no OpenAI model API calls from the Year Mission server. Normal hosting/database usage still applies, and ChatGPT plan limits/policies can change.

### MCP upgrade path

`POST /api/mcp` exposes the same two operations as stateless JSON-RPC tools: `get_year_mission_context` and `create_year_mission_proposal`. It uses the same ChatGPT bearer token. When the account/workspace supports custom MCP apps, replace the temporary shared-token authentication with OAuth/OIDC before broader or multi-user distribution.

## Phase 4 — adaptive missions

The adaptive engine is deterministic and intentionally conservative:

1. Compare recent 7-day sleep, steps, and workout minutes with the previous 7 days.
2. Suggest recovery only when there is adequate sleep coverage and sleep falls materially while training load is not lower.
3. Suggest maintenance for smaller negative sleep/activity trends.
4. Otherwise keep normal mode, especially when data coverage is sparse.
5. Never apply the recommendation automatically.

ChatGPT can record an `ai_proposals` row through the proposal endpoint. That is a review artifact, not an executed change. Existing Year Mission approval/application rules remain authoritative.

## Privacy boundary

- Store only the minimum wellness metrics needed for the mission.
- Do not forward raw HealthKit samples or medical records to ChatGPT.
- Use separate bearer tokens for HealthKit and ChatGPT.
- Rotate either token independently if a device or GPT configuration is compromised.
- Keep service-role credentials server-side only.
