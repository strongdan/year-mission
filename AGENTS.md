# AGENTS.md — Year Mission Codex Instructions

## Mission

Build **Year Mission** as a small, private, mobile-first personal execution tool.

The product exists to help the user:

> Do the right things, in the right order, long enough for meaningful change to occur.

Do not turn this repository into a generalized productivity SaaS, a large self-improvement platform, or an architecture exercise.

The software should practice the same philosophy as the product:

> Fewer priorities. Clear next actions. Real execution. Learn from evidence.

---

# 1. Source-of-Truth Order

Use repository documents in this order:

1. **`SPEC.md`** — authoritative implementation scope.
2. **`DECISIONS.md`** — accepted product/architecture decisions and rationale.
3. **`VISION.md`** — possible future direction only.
4. **`IDEAS.md`** — parking lot only.

If documents conflict:

- `SPEC.md` wins over all other product documents.
- `DECISIONS.md` governs architecture/product choices unless `SPEC.md` explicitly overrides it.
- `VISION.md` and `IDEAS.md` must NEVER silently expand implementation scope.

Do not implement something merely because it appears in `VISION.md` or `IDEAS.md`.

---

# 2. Scope Rule

Before implementing any feature, verify that it is required by `SPEC.md`.

If it is not required by `SPEC.md`:

- do not implement it;
- do not add supporting schema "just in case";
- do not add UI placeholders for it;
- do not create abstractions solely for that possible future;
- do not silently promote it from `VISION.md` or `IDEAS.md`.

When a future-facing design consideration matters for today's implementation, prefer a simple seam or interface over speculative infrastructure.

Example:

Good:

```ts
interface AiProvider {
  generateCoachResponse(input: CoachInput): Promise<CoachResult>
}
```

Bad:

Building a full multi-provider routing marketplace before a second provider is needed.

---

# 3. Personal-Tool Rule

Year Mission is primarily a tool for one person's real use.

Optimize for:

- usefulness;
- reliability;
- speed;
- understandable code;
- low maintenance;
- iPhone usability;
- easy iteration.

Do NOT prematurely optimize for:

- enterprise tenancy;
- team collaboration;
- generic onboarding funnels;
- billing;
- role hierarchies;
- organization management;
- plugin marketplaces;
- broad configuration systems;
- massive scale.

Basic security, auth, migrations, and data isolation are still required.

---

# 4. Product Priority

When choosing between competing implementation approaches, favor the one that best supports this hierarchy:

1. **Execution**
2. **Clarity**
3. **Reliability**
4. **Low cognitive load**
5. **Useful self-knowledge**
6. **Polish**
7. **Extensibility**

Do not sacrifice execution clarity for architectural cleverness.

---

# 5. Core UX Principle

The app should progressively reduce choice.

Conceptually:

```
Annual Goals
    ↓
Season
    ↓
Monthly Focus
    ↓
This Week
    ↓
Today
    ↓
Now
```

At the `Now` level, normally present **one recommended action**.

Do not build interfaces that surface the entire backlog everywhere.

---

# 6. Primary Screens

Primary navigation should remain:

- Today
- Tasks
- Progress
- Coach

Do not add more primary tabs unless `SPEC.md` is explicitly changed.

## Today

This is the highest-priority screen.

It should make the current direction and next actions obvious within seconds.

Protect it from feature creep.

## Tasks

Core flow:

```
Inbox → This Week → Today → Done
```

## Progress

Show only meaningful metrics defined in `SPEC.md`.

## Coach

Use AI to interpret, decompose, challenge, summarize, and recommend.

Do not make chat the center of the product.

---

# 7. Today Capacity

Default Today capacity is five intentional tasks.

Do not silently allow Today to become an unlimited task list.

If the limit is reached, require an explicit tradeoff or clear override.

This constraint is intentional product behavior, not an inconvenience to remove.

---

# 8. Backlog Philosophy

An item being captured does NOT mean it is a commitment.

Inbox, backlog, and Ideas/Later items:

- should not create urgency;
- should not reduce Momentum;
- should not appear on Today unless promoted;
- should not automatically roll forward.

Do not create shame-based overdue behavior.

---

# 9. Deferral Is Data

When a task is deferred repeatedly, preserve that history.

Do not simply change the date and erase the behavioral signal.

Support lightweight friction reasons such as:

- too big
- no energy
- forgot
- blocked
- don't know how
- not important
- just avoiding it
- other

Store this through task events or the simplest equivalent consistent with `SPEC.md`.

---

# 10. "What Should I Do?" Rule

Implement this as a core execution feature.

V1 should be mostly deterministic.

Approximate sequencing order:

1. Weekly Win
2. important time-sensitive obligations
3. current monthly focus
4. incomplete Big Four commitments
5. meaningful repeatedly deferred tasks
6. other active tasks

Adjust for:

- blockers
- available minutes
- energy
- task duration
- week mode

Return **one recommendation** by default.

Do not ask an LLM to perform work that deterministic code can do reliably.

---

# 11. Explainability

`Why This?` should explain the recommendation using stored deterministic reasons.

Example:

- advances current monthly focus
- fits available time
- supports Weekly Win
- deferred twice
- no blocker

Do not spend an AI call merely to restate ranking metadata.

Keep ranking rules testable outside React components.

---

# 12. AI Role

AI is an assistant, not the application authority.

Use AI for:

- task decomposition;
- task parsing when useful;
- coaching;
- reflection;
- weekly/monthly summaries;
- resolving ambiguity;
- challenging overcommitment;
- identifying when further planning is unlikely to help.

Do not use AI for:

- basic CRUD;
- completion toggles;
- ordinary progress calculation;
- deterministic sequencing;
- basic sync;
- calculations that normal code can perform.

---

# 13. AI Mutation Rule

Never allow unrestricted model-driven database writes.

Use:

```
AI response
    ↓
structured proposal
    ↓
schema validation
    ↓
user approval when appropriate
    ↓
application service
    ↓
.database
```

Validate AI-generated actions with Zod or an equivalent schema layer.

Important changes should be visibly reviewable before applying.

---

# 14. Coach Personality and Behavior

The Coach should be:

- concise by default;
- calm;
- practical;
- nonjudgmental;
- willing to disagree;
- focused on execution;
- evidence-based when history exists.

The Coach must NOT automatically praise every idea.

It should identify:

- overcommitment;
- complexity creep;
- avoidance through planning;
- unnecessary experimentation;
- unrelated new goals.

Example acceptable response:

> This is a reasonable idea, but it does not advance the current annual priorities. Park it rather than activating it now.

---

# 15. Reflection-to-Action Rule

Once a useful discussion produces a sufficiently clear physical next action, additional reflection should receive diminishing priority.

If the user repeatedly optimizes an actionable task, the Coach may redirect:

> The next action is already clear. More planning is unlikely to help right now.

Do not apply this when real ambiguity or blockers remain.

This is an important anti-procrastination product behavior.

---

# 16. Major-Life-Decision Guidance

Do not build a large dedicated workflow unless `SPEC.md` changes.

For AI reasoning around major changes, use the lightweight pattern:

```
Recover
  ↓
Repair
  ↓
Expand Options
  ↓
Experiment
  ↓
Decide
```

Avoid assuming dissatisfaction requires dramatic reinvention.

Avoid false A/B decisions when credible alternatives exist.

Prefer reversible experiments before irreversible choices.

---

# 17. Gamification Rule

Gamification must remain restrained.

Acceptable:

- Momentum
- Weekly Wins
- meaningful milestones
- personal bests
- domain progress
- Career Evidence

Avoid:

- coins
- fake XP
- childish badges
- leaderboards
- loud confetti

Real-world progress is the reward signal.

---

# 18. Momentum

Do not over-engineer Momentum.

It should represent meaningful movement, not activity volume.

Missing one day must not zero out progress.

Meta-work such as reorganizing the system should contribute little or nothing.

Favor understandable behavior over mathematically elaborate scoring.

---

# 19. Floor Behavior

Support meaningful minimum versions of important recurring behavior.

Examples:

- 10-minute walk
- 10-minute workout
- 10-minute Home action
- one concrete Career action

A Floor:

- counts as useful;
- preserves continuity;
- should not equal a full Target;
- must not exist solely to preserve a streak.

Recovery and Maintenance modes may rely more heavily on Floors.

---

# 20. Career Evidence

V1 uses a simple evidence log.

Do not prematurely build a complex competency framework.

Store concrete evidence such as:

- shipped meaningful feature;
- solved production issue;
- deployed unfamiliar technology;
- wrote useful technical proposal;
- handled stakeholder problem;
- completed meaningful interview preparation.

Collect the evidence first.

Taxonomy can come later if real usage warrants it.

---

# 21. Experiments

Keep V1 experiments simple.

Fields should support roughly:

- title;
- hypothesis;
- start/end;
- result;
- Keep / Change / Stop.

Default maximum active experiments:

2

Do not build complex dose stages unless actual usage demonstrates the need.

---

# 22. Google Tasks

Supabase is canonical.

Google Tasks is an interoperability layer.

Sync only task-like fields such as:

- title;
- notes;
- due date;
- completion.

Do not force Year Mission's rich metadata into Google Tasks.

Keep synchronization code isolated and testable.

---

# 23. Database

Use Supabase PostgreSQL.

Use migrations.

Use Row Level Security for user-owned data.

Avoid speculative tables.

A table should exist because a current workflow needs it, not because a future idea might.

---

# 24. Authentication and Secrets

Use Supabase Auth with Google.

Never expose to the browser:

- Supabase service-role key;
- AI API keys;
- Google OAuth client secret;
- Google refresh tokens.

Validate server-side input.

Store sensitive integration credentials server-side.

---

# 25. PWA and iPhone UX

Treat iPhone as the primary device.

Test mobile layouts first.

Requirements include:

- installable PWA;
- standalone display;
- safe-area handling;
- correct viewport behavior;
- touch-friendly targets;
- fast perceived response;
- offline application shell;
- sensible optimistic UI.

Do not design desktop first and shrink it afterward.

---

# 26. Code Organization

Prefer a simple structure with domain logic outside UI.

For example:

```
app/
components/
domain/
  tasks/
  sequencing/
  progress/
services/
  ai/
  google/
  supabase/
lib/
```

Exact structure is flexible.

Important constraints:

- do not embed business rules throughout page components;
- do not scatter Supabase calls everywhere;
- do not scatter AI-provider calls everywhere;
- keep sequencing logic unit-testable;
- keep Google sync logic isolated.

---

# 27. Engineering Style

Use:

- TypeScript strict mode;
- small composable functions;
- explicit types;
- Zod at external boundaries;
- migrations;
- accessible semantic markup;
- robust errors;
- clear loading states;
- optimistic UI where safe.

Avoid:

- giant components;
- giant service classes;
- premature generic frameworks;
- unnecessary dependency additions;
- hidden global state;
- cleverness that makes future modification harder.

Prefer simple code that is easy to change.

---

# 28. Race Conditions and Persistence

Assume rapid mobile interaction.

Do not allow quick consecutive updates to overwrite one another due to stale state or unordered writes.

For optimistic state:

- use functional updates; 
- serialize writes where necessary; 
- design idempotent mutations where practical; 
- test rapid consecutive actions.

Persistence correctness is more important than animation polish.

---

# 29. Error Behavior

Failures must preserve user data.

Examples:

AI unavailable:

> Coach is unavailable right now. Your plan and tasks are unchanged.

Google sync failure:

- keep local canonical state;
- expose a clear sync status;
- retry safely.

Network failure:

- preserve optimistic state carefully;
- avoid silently losing task edits.

Do not use alarming error language for recoverable failures.

---

# 30. Testing Expectations

Do not consider a feature complete solely because it renders.

## Unit-test:

- Today capacity;
- sequencing;
- blocker exclusion;
- duration filtering;
- Weekly Win priority;
- deferral tracking;
- friction logging;
- Floor logic;
- AI action validation;
- Google conflict resolution.

## Integration-test:

- auth;
- Supabase CRUD + RLS;
- AI proposal → validation → mutation;
- Google task sync.

## E2E-test critical flows:

1. sign in;
2. add Inbox task;
3. promote to This Week;
4. move to Today;
5. complete;
6. verify persistence;
7. rapid consecutive updates;
8. record progress;
9. perform Weekly Review;
10. ask Coach;
11. approve AI proposal;
12. simulate AI failure;
13. run What Should I Do?;
14. verify mobile viewport/PWA behavior.

---

# 31. Final Standard

Year Mission should not become another system the user has to maintain.

It should reduce the amount of mental work required to operate the year.

The app should increasingly answer:

> What matters?
> What should I ignore?
> What should I do now?
> Why am I avoiding this?
> Am I actually moving forward?

The best possible behavior loop is:

```text
Choose
  ↓
Act
  ↓
Observe
  ↓
Learn
  ↓
Adjust
  ↓
Act Again
```

Not:

```text
Plan
  ↓
Optimize
  ↓
Research
  ↓
Re-plan
  ↓
Never Start
```

Build the first loop.

---

# 32. Implementation Order

Unless the repository already contains later phases, prioritize work in this order.

## Phase 1 — Foundation

- Next.js PWA
- Supabase
- Google sign-in
- RLS
- Today
- Tasks
- Big Four
- Weekly Win
- progress entry
- Weekly Review
- Career Evidence
- basic Coach

## Phase 2 — Execution

- What Should I Do?
- deterministic sequencing
- Why This?
- execution mode
- friction/deferral reasons
- Floor fallback
- Reliability/Promises only if still in active `SPEC.md`

## Phase 3 — Integration

- Google Tasks OAuth
- two-way sync
- conflict handling
- sync diagnostics

## Phase 4 — Evidence-driven changes

Only after sustained real usage.

Review actual behavior before choosing features from `VISION.md`.

---

# 33. 30-Day Feature Freeze

Once the core system works:

> Do not substantially redesign it for 30 days.

During this period, record:

- Annoying
- Missing
- Ignored
- Helpful
- Confusing
- Surprisingly valuable

Do not immediately implement every observation.

At the end of the period, use actual evidence to choose the roadmap.

---

# 34. Promotion From VISION or IDEAS

A future idea may be promoted only when there is evidence such as:

1. the same problem has happened repeatedly;
2. actual use has produced repeated demand;
3. the feature clearly reduces friction;
4. the feature is required for a proven workflow.

---

# 35. Change Discipline

When asked to make a change:

1. Read the relevant `SPEC.md` section.
2. Check `DECISIONS.md` for accepted constraints.
3. Inspect the current code before modifying it.
4. Make the smallest coherent change that satisfies the requirement.
5. Add/update tests.
6. Verify mobile behavior if UI changed.
7. Verify persistence if state changed.
8. Do not opportunistically add unrelated features.

Avoid "while I'm here" scope expansion.

---

# 36. Refactoring Discipline

Refactor when necessary to:

- remove duplication;
- fix correctness;
- improve testability;
- enable the requested feature cleanly.

Do not undertake broad rewrites merely because another architecture seems more elegant.

Preserve working behavior unless the requirement explicitly changes it.

---

# 37. Dependency Discipline

Before adding a dependency, ask:

- Is this actually needed?
- Is the platform/framework already capable?
- Is the dependency maintained?
- Does it materially simplify the implementation?

Avoid dependencies for trivial utilities.

---

# 38. When Requirements Are Ambiguous

Prefer the interpretation that:

- keeps Today simple;
- reduces user effort;
- minimizes new concepts;
- preserves existing behavior;
- avoids adding scope;
- is easy to change later.

Do not resolve ambiguity by building multiple modes and settings "to be safe."

A sensible default is better than a configuration surface.

---

# 39. User Data Philosophy

Store data because it supports:

- execution;
- progress;
- useful review;
- future evidence-based self-knowledge.

Do not collect data simply because it might someday be interesting.

Avoid turning the app into exhaustive life logging.

---

# 40. Final Check Before Every Significant Feature

Ask:

1. Is this in `SPEC.md`?
2. Does it improve execution or reduce friction?
3. Does it make Today more complicated?
4. Could the Coach handle this without new product machinery?
5. Are we solving a real problem or an imagined future problem?
6. What is the simplest implementation that works?
7. What test proves it works?

If #1 is no:

> Do not implement it.

---

# Final Product Standard

Year Mission should feel a quiet, capable personal operating system.

It should help the user answer quickly:

- What matters now?
- What should I ignore?
- What is the next physical action?
- Why am I avoiding something?
- Am I actually moving forward?

The preferred loop is:

```text
Choose
  ↓
Act
  ↓
Observe
  ↓
Learn
  ↓
Adjust
  ↓
Act Again
```

The project itself must avoid this loop:

```text
Plan
  ↓
Optimize
  ↓
Research
  ↓
Re-plan
  ↓
Never Use
```

Build the first loop.
---
