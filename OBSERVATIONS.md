# Year Mission — 30-Day Feature Freeze Log

Freeze starts: 2026-08-19.

During this period we do not substantially redesign the core system.
Record real observations as they come up. Do not implement them now.

Categories (AGENTS.md §33):

- Annoying
- Missing
- Ignored
- Helpful
- Confusing
- Surprisingly valuable

## Annoying

- (empty)

## Missing

- (empty)

## Ignored

- (empty)

## Helpful

- (empty)

## Confusing

- (empty)

## Surprisingly valuable

- (empty)

At the end of the freeze, use actual evidence to choose the next roadmap items.

## Log — 2026-08-22

- **Evening Reset shipped during freeze (exception, user-approved):** `9959466` + migration `0010` (`daily_checkins.evening_reset_completion`/`variant`). Variant per `src/domain/evening-reset.ts:11` — Mon/Wed/Fri Down-Regulation 20–30m, Tue Lower Body 15–25m, Thu Upper Body+Spine 15–25m, Sat Yoga Flow 20–40m, Sun Restore 10–30m, floor 5m. UI `src/components/today/evening-reset-card.tsx:12` on Today. Remote prod confirmed `200` on `evening_reset_completion` select, `migration list` 0010 synced, Vercel `dpl_6iP8iw7xW8XhmDdbxGqcpiA4wUnm` READY 15:24 PDT duration 23s.
- Next: use Today daily, record under categories above. Do not add Progress sparkline / weekly rollup / Coach context until freeze ends unless repeated pain.