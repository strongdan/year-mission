# Adventure as a visual narrative layer

## Product goal

Make Year Mission feel like a living side-scrolling adventure without turning life into a compulsive optimization system.

The player character represents the user. Real-world movement and meaningful action move the character through the world.

## World hierarchy

- **Year Mission** — the full campaign.
- **Season** — major world / mega-level. Each season rotates through a distinct visual biome.
- **Month** — chapter / major sub-level, labeled with the current Monthly Focus when one exists.
- **Week** — a short adventure inside the chapter.
- **Day** — the current position in the calendar trail. The character advances with calendar context and meaningful landmarks, not points.

Current biomes are Evergreen Passage, Wild Coast, High Country, and Aurora Reach. They are deliberately abstract so a later art pass can replace them with sprite sheets or tilemaps without changing progression logic.

## No points economy

Adventure deliberately has no XP, levels, daily targets, streaks, or activity-volume rewards. It shows calendar position, real completed meaningful milestones, Annual Focus landmarks, health observations as context, and month-end reflection encounters. A rest day is a valid part of the journey.

### Evidence shown as context

Meaningful completed work and check-ins can appear as landmarks. Meta-work is not treated as progress.

### Movement / Apple Health

Health data is used as broad movement context, not a clinical assessment or reward conversion.

### Check-ins

Check-ins can mark lived progress. Skipping one has no negative effect.

### Anti-grind constraints

- there are no streak penalties
- prior progress is permanent
- missed days do not create debt
- recovery and ordinary life should remain valid reasons not to maximize a day

## Progress scales

Progress meters show calendar position through day, week, month, and season. They are not grades and do not measure activity volume.

## Rewards

V1 rewards are representational rather than spendable currency:

- trail markers, camps, and landmarks are tied to calendar position or real milestones
- existing achievements remain permanent proof points

Future rewards can include cosmetic character gear, companion animals, campsites, map decorations, discovered landmarks, season trophies, and optional collectible artifacts. Avoid pay-to-win, random loot boxes, loss aversion, or punishment mechanics.

## Rendering approach

V1 uses native React + CSS + SVG and the repository's existing open-source Lucide icon set. A game engine is intentionally not added yet: Phaser/Pixi would add bundle weight and lifecycle complexity before we need physics, collisions, tilemaps, or interactive combat.

If the experience evolves into richer exploration, keep the visual layer separate from the evidence and reflection rules in `src/domain/adventure.ts`.

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
