# Life Balance + Apple Health

## Product intent

Year Mission should help the user balance what is already on the calendar with what they actually want to do, especially the restorative options that tend to disappear from awareness during busy weeks.

This feature is visibility-first, not discipline-first. The app should resurface options without converting them into obligations.

## Monday reset

Monday is the natural weekly planning point. The Today screen shows a **Monday reset** title on Mondays and **Life balance** the rest of the week.

The card combines:

- the current week's Google Calendar shape;
- a deliberately small Life Menu;
- current Apple Health movement signals;
- a cautious recovery signal based on HRV and resting heart rate relative to the user's recent baseline.

It should answer:

> Where is there room this week, and what could I do with that room that would make the week better to live?

## Life Menu

Keep the menu small and concrete:

1. Go outside — walk, woods, beach, or simply getting out.
2. Go to the pool — swim, float, or use the sauna while there.
3. Cold plunge.
4. Stretch / mobility.
5. Masters swim — Saturday morning.
6. Unstructured reset — read, sit, lie down, or do nothing useful for a while.

These are options, not commitments. Do not add streaks, overdue state, or guilt-producing completion tracking.

## Calendar behavior

Google Calendar remains read-only context. The life-balance card summarizes the number of events per day as a lightweight indication of calendar load. It does not treat event count as an objective measure of difficulty or automatically schedule leisure activities.

The app should preferentially surface lighter days as places where the user might protect an opening.

## Apple Health / HealthKit

The web PWA cannot read HealthKit directly. The existing iPhone companion is the bridge.

The PWA requests a ten-minute signed native ticket from:

`POST /api/health/apple/native-ticket`

and opens:

`yearmission://health-sync?ticket=...&base=...`

The native app handles that URL with `HealthKitSyncCoordinator`, requests read-only HealthKit permission, gathers recent daily summaries, and posts them to:

`POST /api/health/apple/native-sync`

No long-lived API secret is stored in the native app. The same short-lived signed ticket mechanism used by native Brain Dump is reused for identity.

The summary intentionally stores only daily aggregates needed by Year Mission:

- steps;
- active energy / Move calories;
- exercise minutes;
- stand hours approximation;
- HRV SDNN;
- resting heart rate;
- sleep minutes.

Do not store raw heart-rate samples, workout GPS tracks, or other high-resolution HealthKit data unless a future product decision explicitly requires it.

## Recovery interpretation

Recovery is not a medical diagnosis and is not represented as a precise readiness score.

The deterministic V1 signal is one of:

- lower than usual;
- around baseline;
- stronger than usual;
- not enough data.

It compares current HRV and resting heart rate to recent personal medians using deliberately wide thresholds. The copy must describe the result as a hint, not a fact about what the user can or cannot do.

Movement metrics are displayed as observations only. Steps, exercise minutes, stand hours, and active energy must not become another optimization scoreboard.

## iPhone target setup

Add `HealthKitSyncFeature.swift` to the existing Year Mission iPhone target and enable the HealthKit capability. Add a Health Share Usage Description explaining that Year Mission reads daily activity and recovery summaries to help balance busy weeks with movement and recovery.

At the app root, route incoming URLs to both existing native coordinators, for example:

```swift
.onOpenURL { url in
    if healthSync.handle(url: url) { return }
    _ = brainDump.handle(url: url)
}
```

Keep HealthKit access read-only.

## Acceptance criteria

- Monday shows the reset framing without requiring a Sunday review.
- The calendar section identifies lighter and busier days without automatically filling them.
- The Life Menu remains visible even when no HealthKit data exists.
- Apple Health Connect launches the installed native app through `yearmission://health-sync`.
- The native app asks only for read access to the required HealthKit types.
- A successful native sync stores at most one daily aggregate row per user/date/source.
- RLS prevents users from reading one another's health summaries.
- Recovery copy remains qualitative and baseline-relative.
- Missing HealthKit data degrades gracefully instead of blocking the card.
