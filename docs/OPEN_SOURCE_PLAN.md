# Open Source Plan

## Decision

Year Mission should remain private while the product is still proving its core behavior-change model. If the adventure/game layer and broader product demonstrate real sustained value, prepare a deliberate open-source release rather than publishing the repository impulsively.

The goal is to open source the useful engine and product patterns without exposing private user data, deployment secrets, personal integrations, or infrastructure-specific assumptions.

## What success needs to look like first

Open sourcing should be considered only after the product has enough evidence that it is worth maintaining publicly.

Minimum evidence before starting the release process:

- Daniel uses the product consistently for at least 8-12 weeks after the adventure system is stable.
- The game improves engagement with real life rather than simply increasing app interaction.
- Day/week/month/season progression feels understandable without explanation.
- The anti-grind rules hold up in practice: no streak anxiety, no catch-up debt, and no pressure to maximize every day.
- Health/activity integrations are reliable enough that users are not regularly correcting the system by hand.
- The app can be installed and run by someone other than the original developer from written instructions.
- Core behavior is covered by tests and the normal lint/typecheck/test/build gates are consistently green.
- At least a small number of outside users, if available, report that the product is useful enough that they would continue using it.

This is a product-validation gate, not a calendar deadline.

## Proposed open-source shape

Prefer an **open-core-like repository structure without creating a paywall around the personal-development engine**.

The public project should include:

- the Year Mission planning model
- Day / Week / Month / Season adventure hierarchy
- XP and anti-grind progression engine
- seasonal goal emphasis system
- holiday/rest-day system
- Big Four radar
- adventure renderer and visual components
- local/manual activity inputs
- provider interfaces for calendar, health, auth, and storage
- database schema and migrations needed for a self-hosted instance
- tests, sample data, and development fixtures

Keep deployment-specific or private material out of the public release:

- production secrets and environment values
- private user data
- personal calendar/health payloads or fixtures derived from real records
- Cloudflare/Supabase identifiers tied to the live account
- Apple credentials/signing assets
- internal operational notes containing account details
- any third-party assets whose license does not permit redistribution

## Architecture work to do before release

The current app should gradually move toward an architecture that makes a public release easy even if the release never happens.

1. **Separate the game engine from providers.**
   Keep progression, seasonal logic, holidays, rewards, maps, and encounters in framework-independent domain modules.

2. **Define integration adapters.**
   Apple Health, Google Calendar, Supabase, auth, and future integrations should sit behind explicit interfaces so self-hosters can substitute their own providers.

3. **Add a local/demo mode.**
   The public repository should start with generated sample data and work without connecting Apple Health, Google Calendar, or production services.

4. **Remove account-specific assumptions.**
   Alaska holidays can remain a built-in calendar option, but employment-specific rules should be configuration rather than global defaults.

5. **Create portable configuration.**
   Seasonal emphasis, XP targets, holidays, life-menu choices, and rewards should move toward configuration where practical rather than requiring forks.

6. **Audit privacy boundaries.**
   Treat health, journal, calendar, relationship, and behavioral data as especially sensitive. Public code must never include real payloads in tests, screenshots, logs, fixtures, or example exports.

## Release phases

### Phase 0 — Private proving period

Current phase.

- iterate quickly
- collect real usage experience
- keep architecture reasonably modular
- avoid spending time on community infrastructure before product value is proven

### Phase 1 — Open-source readiness audit

Trigger once the success criteria above are substantially met.

Tasks:

- secret scan and repository-history audit
- dependency and asset-license audit
- privacy/data-flow review
- remove obsolete/private-only code
- verify a clean install from a fresh machine/container
- add deterministic demo data
- document supported deployment path
- decide project name/branding boundaries
- choose final license

### Phase 2 — Public beta repository

Publish only when a clean-room install succeeds.

Initial public-release package should include:

- README with a 5-10 minute product overview
- screenshots/GIFs of the adventure model using synthetic data
- architecture overview
- self-host quick start
- `.env.example`
- contribution guide
- code of conduct
- security policy and private vulnerability-reporting path
- issue/feature-request templates
- changelog and versioning policy
- public roadmap with a clearly labeled non-commitment section

Tag the first public release as an early beta rather than `1.0`.

### Phase 3 — Community validation

For the first 60-90 days after publication:

- watch installation friction closely
- favor documentation and onboarding fixes over feature expansion
- identify which integrations people actually request
- accept narrowly scoped contributions first
- keep product philosophy explicit so contributors do not accidentally optimize for streaks, compulsive engagement, or punitive gamification
- track whether community maintenance cost is justified by adoption

### Phase 4 — Stable public project

Move toward `1.0` only when:

- self-hosting is repeatable
- data migrations are stable
- provider interfaces are documented
- release/versioning process is predictable
- security/update ownership is sustainable
- there is enough usage to justify compatibility promises

## License decision

Do not choose the license merely because it is common.

Default evaluation order when the project reaches Phase 1:

1. **AGPL-3.0** if preserving improvements to hosted versions is important.
2. **MPL-2.0** if a weaker file-level copyleft model provides a better contribution/adoption balance.
3. **Apache-2.0** if maximum adoption and commercial reuse are more important than requiring downstream source availability.

Make the final decision after considering whether Year Mission is intended primarily as a public-good/self-hosting project, a future hosted business, or both. Obtain legal review before the public release if commercial plans become material.

## Community/product principles

A public Year Mission project should protect the same design philosophy as the private product:

- agency over coercion
- lived experience over dashboard optimization
- no streak punishment
- no missed-day debt
- rest can count as successful play
- health signals are context, not medical judgments
- meaningful action beats meta-work
- configuration should allow different lives rather than assuming one ideal routine

These principles should eventually become part of `CONTRIBUTING.md` so they guide feature proposals and reviews.

## Sustainability options

Open source does not require turning Year Mission into a business. If maintenance becomes substantial, possible sustainable models include:

- free self-hosting + paid hosted service
- paid managed integrations/sync
- supporter/sponsor funding
- paid mobile distribution if platform work warrants it
- optional premium art/theme packs while keeping core mechanics open

Do not decide on monetization until actual demand appears.

## Near-term roadmap item

For now, the required work is intentionally small:

- keep new game/domain logic modular and provider-independent
- avoid committing real personal data or provider secrets
- use synthetic fixtures in tests and docs
- maintain this plan as features evolve
- revisit the open-source gate after 8-12 weeks of stable real-world use

No public-repository conversion, license file, community launch, or compatibility promise should happen before that review.
