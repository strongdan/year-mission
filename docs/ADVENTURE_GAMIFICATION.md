# Adventure Gamification

## Product goal

Make Year Mission feel like a living side-scrolling adventure without turning life into a compulsive optimization system.

The player character represents the user. Real-world movement and meaningful action move the character through the world.

## World hierarchy

- **Year Mission** — the full campaign.
- **Season** — major world / mega-level. Each season rotates through a distinct visual biome.
- **Month** — chapter / major sub-level, labeled with the current Monthly Focus when one exists.
- **Week** — a short adventure inside the chapter.
- **Day** — the mini-level shown on Today. The character physically advances along the path as XP is earned.

Current biomes are Evergreen Passage, Wild Coast, High Country, and Aurora Reach. They are deliberately abstract so a later art pass can replace them with sprite sheets or tilemaps without changing progression logic.

## XP economy

XP is derived from evidence already stored by Year Mission; there is no manual XP button.

### Meaningful tasks

- low impact: 20 XP
- medium impact: 35 XP
- high impact: 55 XP
- Weekly Win bonus: +40 XP
- courage task bonus: +20 XP
- meta-work: 0 XP

This keeps re-organizing the system from being a profitable game strategy.

### Movement / Apple Health

Daily movement XP is capped by category:

- steps: up to 40 XP
- active Move energy: up to 25 XP
- exercise minutes: up to 40 XP
- stand hours: up to 24 XP
- explicit mobility/stretching workouts: up to 25 XP

Health data is used as broad evidence of movement, not as a clinical assessment.

### Check-ins

- morning check-in: +15 XP
- evening reset target: +20 XP
- evening reset floor: +10 XP

A skipped check-in never removes XP.

### Anti-grind constraints

- daily XP is capped at 260
- there are no streak penalties
- prior progress is permanent
- missed days do not create debt
- day progress is considered substantively complete around 180 XP; additional activity is optional
- recovery and ordinary life should remain valid reasons not to maximize a day

## Progress scales

Initial tuning targets:

- day: 180 XP
- week: 900 XP
- month: 3,600 XP
- season: 10,800 XP
- player level: every 500 accumulated XP

These values are intentionally easy to change after 30 days of observed use.

## Rewards

V1 rewards are representational rather than spendable currency:

- trail marker around 100 daily XP
- day camp around 180 daily XP
- perfect expedition at the 260 daily cap
- player level-ups every 500 XP
- existing achievements remain permanent proof points

Future rewards can include cosmetic character gear, companion animals, campsites, map decorations, discovered landmarks, season trophies, and optional collectible artifacts. Avoid pay-to-win, random loot boxes, loss aversion, or punishment mechanics.

## Rendering approach

V1 uses native React + CSS + SVG and the repository's existing open-source Lucide icon set. A game engine is intentionally not added yet: Phaser/Pixi would add bundle weight and lifecycle complexity before we need physics, collisions, tilemaps, or interactive combat.

If the experience evolves into richer exploration, **Phaser 3** is the preferred first evaluation for a true 2D game layer; **PixiJS** is the lighter alternative for sprite-heavy rendering without a full game framework. Keep the XP/progression model in `src/domain/adventure.ts` so either renderer can replace the current scene without rewriting the game rules.

## Next useful upgrades

1. Replace the compass placeholder character with a small user-selected avatar and walking animation.
2. Add unlocked cosmetic gear tied to milestones rather than raw activity volume.
3. Add weekly landmarks and month-end gates/boss-style reflection encounters.
4. Add season maps with branching optional paths based on real choices (outside, pool, Masters, family, creative time) rather than only task completion.
5. Add a small reward reveal animation after completion events, with reduced-motion support.
6. Use the Life Menu to spawn optional side quests when calendar space and recovery signals make them sensible.
7. Add local-first caching of the current scene so Today renders instantly even when integrations are slow.

## Guardrail

The game exists to make real life easier to engage with. When the day's useful work and movement are already sufficient, the correct gameplay instruction can be: **leave the app and go live the rest of the day.**
