# Annual Focuses

## Product decision

A Year Mission is anchored by **3 or 4 main focuses** chosen by the user for the year.

These are the few areas the user wants the year to meaningfully change. They sit above seasons, months, weeks, and daily tasks in the planning hierarchy:

```text
Year Mission
  ↓
3–4 Annual Focuses
  ↓
Seasonal emphasis
  ↓
Monthly focus / chapter
  ↓
Weekly adventure
  ↓
Daily level
```

Annual Focuses are not a checklist and are not meant to receive equal attention every week. Their purpose is to reduce diffusion: when many interesting goals compete for attention, the app can ask whether a proposed commitment advances one of the few things the user deliberately chose for this year.

## Selection rules

- A mission should normally have **3 or 4 active Annual Focuses**.
- Fewer than 3 is allowed only while the mission is being set up.
- More than 4 should require replacing or retiring an existing focus rather than simply adding another.
- Focuses are editable because the user may discover that the original framing was wrong.
- Replacing a focus does not erase prior progress or history.
- A focus may be intentionally quiet during a season; inactivity is not failure.

## Starter focus library

Offer a small starter library plus a custom option. Suggested starters:

- Health & Energy
- Family & Relationships
- Career & Craft
- Money & Security
- Home & Environment
- Adventure & Outdoors
- Learning & Growth
- Creativity
- Community & Friendship
- Build Something

The starter is only wording. Users can rename every focus and write their own outcome statement.

## Focus fields

Each Annual Focus should contain:

- `title` — short label, e.g. “Health & Energy”
- `objective` — what meaningful change by year-end would look like
- `why` — optional reason this matters
- `icon` / visual key — optional presentation metadata
- `sort_order`
- `status` — active / retired
- optional relationship to an existing Big Four domain

Example:

> **Adventure & Outdoors**
>
> Spend substantially more of the year outside: hiking, biking, swimming, skiing, family adventures, and trips that make the year feel lived rather than merely productive.

## Relationship to the Big Four radar

Annual Focuses and the Big Four radar solve different problems.

- **Annual Focuses:** what this particular year is about.
- **Big Four radar:** a lightweight guardrail showing whether broad parts of life are disappearing entirely.

Do not force the Annual Focuses to equal Body / Career / Self / Money. A user might choose Adventure, Family, Career, and Health while the radar still quietly prevents Money or Self from becoming invisible.

## Game integration

Each Annual Focus becomes a **campaign thread** running through the year.

Game presentation should gradually add:

- one visual crest/icon per Annual Focus
- focus-colored quest markers on month/week maps
- optional side quests tied to the focuses
- season recommendations that favor focuses naturally suited to that season
- a year map showing which focus each major landmark advanced
- focus-specific milestone collectibles

A task can contribute to one primary Annual Focus when useful, but ordinary life should not require categorizing every action.

## Seasonal behavior

The same 3–4 focuses persist across the year, but their weight can change by season.

Example:

**Summer**
- Adventure & Outdoors — high emphasis
- Health & Energy — high emphasis
- Family & Relationships — high emphasis
- Career & Craft — maintenance

**Fall/Winter**
- Career & Craft — high emphasis
- Learning & Growth — high emphasis
- Health & Energy — maintenance / indoor training
- Adventure & Outdoors — lower but still available

This is emphasis, not a quota system.

## Coach behavior

The Coach should know the active Annual Focuses and use them as a filter when helping choose commitments.

When the user proposes another project, the Coach may ask:

> Which of your four focuses does this advance?

If the answer is “none,” that does not automatically make the idea bad. It is evidence that the idea probably belongs in Ideas/Later rather than becoming another active obligation.

The Coach should also notice over-concentration without demanding artificial balance:

> Career has received most of your attention this month. That may be right for this season, but Adventure has been absent. Do you want one small outside quest this week, or is that an intentional tradeoff?

## UX

### Mission setup

Add a “Choose what this year is about” step:

1. Show starter focus cards.
2. User selects 3–4.
3. Let the user rename each selection.
4. Ask for one sentence describing what “better by year-end” means.
5. Confirm the set as the current mission's campaign threads.

Do not ask the user to build a detailed annual plan at this point.

### Settings / Mission edit

Provide an Annual Focuses card where the user can:

- review the current 3–4
- edit title/objective
- reorder them
- retire/replace one
- see a warning rather than a hard error if the mission is temporarily below 3 during editing
- prevent saving a fifth active focus without first retiring/replacing one

### Today / game

Today should not become another dashboard. Show Annual Focuses only when they clarify why a quest matters. The full set belongs primarily on the larger Week/Month/Year game maps and planning surfaces.

## Anti-optimization guardrails

- Do not create a percentage allocation target across focuses.
- Do not penalize a quiet focus.
- Do not require every task to have a focus.
- Do not turn the focuses into four simultaneous daily goals.
- Do not recommend adding a fifth focus because one area is temporarily interesting.
- Seasonal concentration is allowed and expected.

The core question is not “Did I balance all four?” It is:

> Over the course of this year, am I becoming more of the person I meant to become in the few areas I deliberately chose?
