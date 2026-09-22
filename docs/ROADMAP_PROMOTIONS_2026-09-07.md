# Roadmap promotions — 2026-09-07

The owner explicitly promoted the following previously parked ideas into active Year Mission product work:

1. **Monthly Scorecard** — a compact, non-judgmental monthly view of meaningful execution, Weekly Wins, courage tasks, workouts, strongest signal, and the domain that needs protection.
2. **Stale Backlog Review** — surface Someday tasks untouched for 90+ days and require an explicit choice to reactivate or drop them; never auto-promote stale work.
3. **Decision Log** — record consequential decisions with context, reasoning, confidence, a review date, and the eventual outcome to improve calibration and self-knowledge.

Product constraints:

- These features must reduce clutter or improve judgment; they must not become another optimization obligation.
- The Monthly Scorecard is evidence, not a grade or reward system.
- Stale backlog review never auto-activates tasks.
- Decision outcomes remain user-entered and are not scored by AI.
- Existing Weekly Review `stop_doing` remains the canonical Stop Doing mechanism; do not create a duplicate system.

Implementation landing: `/review`, with Progress linking to the Review workspace.
