# Year Mission — DECISIONS.md

## Purpose

This document records important product and architecture decisions for Year Mission.

The goal is to prevent repeated re-litigation of decisions and to preserve the reasoning behind them.

Update this file when a meaningful decision changes.

---

# D001 — Year Mission is primarily a personal tool

**Status:** Accepted

Year Mission is primarily being built for one user's real life.

Do not optimize prematurely for:

- large-scale SaaS onboarding
- teams
- collaboration
- generic configurability
- enterprise tenancy
- broad-market feature completeness

Basic data isolation and good engineering practices still matter.

But personal usefulness outranks generalized product architecture.

---

# D002 — Optimize for execution, not engagement

**Status:** Accepted

The product's success metric is not:

- daily active usage
- time in app
- AI messages sent
- tasks created
- checkboxes completed

A good interaction may take 30 seconds.

The best outcome may be the user closing the app and doing something in the real world.

---

# D003 — Today is the primary product surface

**Status:** Accepted

Most user interaction should flow through Today.

Today should remain small and execution-focused.

Do not allow feature growth to turn Today into a large dashboard.

---

# D004 — Use constrained task flow instead of a conventional to-do list

**Status:** Accepted

Core task flow:

```text
Inbox → This Week → Today → Done
```

Reason:

Traditional task systems often become warehouses of intentions.

Year Mission should distinguish captured ideas from active commitments.

---

# D005 — Limit Today

**Status:** Accepted

Default maximum:

5 intentional tasks

Reason:

A large Today list destroys prioritization and makes avoidance easier.

When Today is full, adding more work should require explicit tradeoff.

---

# D006 — Supabase is the canonical source of truth

**Status:** Accepted

Use Supabase PostgreSQL for:

- plans
- tasks
- task history
- progress
- reviews
- experiments
- AI-related state
- integration metadata

Google Tasks is an interoperability layer, not the main database.

---

# D007 — Google Tasks is a two-way task interface, not the life-system database

**Status:** Accepted

Google Tasks may contain:

- title
- notes
- due date
- completion

Year Mission retains richer metadata such as:

- domain
- project
- deferral history
- friction
- sequencing
- Weekly Win
- behavioral context

---

# D008 — Deploy with Next.js on Vercel

**Status:** Accepted

Target architecture:

```text
iPhone / Browser
        ↓
Next.js PWA on Vercel
        ↓
 ┌──────────┬────────────┬──────────┐
 ↓          ↓            ↓
Supabase  Google Tasks    AI
```

Reason:

Portable, conventional architecture with strong support for PWA, server-side APIs, auth integrations, and AI.

---

# D009 — Use Supabase Auth with Google

**Status:** Accepted

Primary sign-in:

Google OAuth through Supabase Auth.

Google Tasks permissions should be requested when the integration is enabled.

Sensitive refresh tokens remain server-side.

---

# D010 — AI is not the database authority

**Status:** Accepted

AI may propose changes.

Application code owns mutations.

Pattern:

```text
AI proposal
    ↓
schema validation
    ↓
approval when appropriate
    ↓
application service
    ↓
database
```

Do not give the model unrestricted SQL or mutation access.

---

# D011 — Use AI selectively

**Status:** Accepted

Do not call AI for deterministic operations.

AI is useful for:

- parsing
- decomposition
- coaching
- summarization
- reflection
- ambiguous prioritization

AI is not needed for:

- marking tasks complete
- calculating Momentum
- normal CRUD
- basic task ranking
- metric updates
- deterministic Google sync

---

# D012 — Keep the AI provider swappable

**Status:** Accepted

Start with an inexpensive OpenAI model for lightweight operations and a stronger small model for coaching.

Do not scatter model-specific implementation throughout application code.

Use a provider/service abstraction.

---

# D013 — Sequencing should be deterministic first

**Status:** Accepted

`What Should I Do?` should initially rely on clear application logic.

Approximate priority:

1. Weekly Win
2. important time-sensitive work
3. monthly focus
4. Big Four gaps
5. repeatedly deferred meaningful work
6. other active tasks

AI may assist when ambiguity remains.

Reason:

Predictability, cost control, explainability, and easier debugging.

---

# D014 — Explain recommendations

**Status:** Accepted

`Why This?` should normally explain deterministic reasons.

Example:

- advances current monthly focus
- fits available time
- deferred twice
- Weekly Win related
- no blocker

Do not invoke an LLM merely to restate ranking reasons.

---

# D015 — Repeated deferral is useful data

**Status:** Accepted

The app should not blindly move overdue tasks forever.

Track deferral and optionally ask why.

Reasons include:

- too big
- no energy
- forgot
- blocked
- don't know how
- not important
- just avoiding it

This history may support future self-knowledge.

---

# D016 — Avoid punitive streak design

**Status:** Accepted

No broken-streak shame.

No giant overdue counters.

No red failure state for ordinary disruption.

Use Momentum, Floors, Maintenance, and Recovery concepts instead.

---

# D017 — Gamification must represent meaningful progress

**Status:** Accepted

Avoid:

- coins
- fake XP
- childish badges
- leaderboards
- arbitrary confetti

Potentially use:

- Momentum
- Weekly Wins
- meaningful milestones
- personal bests
- visible evidence
- domain progress

The reward is seeing real change accumulate.

---

# D018 — Floor behaviors are legitimate fallbacks

**Status:** Accepted

Important recurring behaviors may have a small meaningful Floor.

Examples:

- 10-minute walk
- 10-minute workout
- 10-minute house action
- one concrete Career action

Floor does not equal Target.

The point is continuity without all-or-nothing failure.

---

# D019 — Career confidence starts with evidence, not a taxonomy

**Status:** Accepted

V1 uses a simple Career Evidence log.

Do not build a complex competency matrix until enough real evidence exists to justify one.

Reason:

Collect actual data before designing categories around hypothetical data.

---

# D020 — Experiments remain simple initially

**Status:** Accepted

V1 experiments use:

- hypothesis
- end date
- result
- Keep / Change / Stop

Default maximum active experiments:

2

Do not build sophisticated experiment-dose workflows until actual usage demonstrates the need.

---

# D021 — The Coach may disagree

**Status:** Accepted

The Coach should optimize for the annual outcomes and sustainable execution.

It may challenge:

- overcommitment
- unnecessary complexity
- endless optimization
- unrelated new goals
- novelty-driven changes

Do not make the Coach sycophantic.

---

# D022 — Reflection must eventually terminate in action

**Status:** Accepted

Once a sufficiently clear next physical action exists, further planning receives diminishing value.

Coach should redirect repeated optimization toward execution when appropriate.

This is especially important because the app itself must not become a sophisticated form of procrastination.

---

# D023 — Major reinvention remains a Coach reasoning pattern, not a V1 subsystem

**Status:** Accepted

For major decisions, Coach should consider:

```text
Recover → Repair → Expand Options → Experiment → Decide
```

Do not create a large database/UI subsystem unless repeated use demonstrates value.

---

# D024 — Relationships are a guardrail, not a fifth scored domain

**Status:** Accepted

Do not make every area of life another metric.

Relationship impact may eventually be checked during reviews.

Do not make it another mandatory weekly checklist.

---

# D025 — Product complexity itself is a risk

**Status:** Accepted

Year Mission must not become a project that consumes the time it is supposed to protect.

Therefore:

- speculative features stay out of `SPEC.md`
- ideas go to `IDEAS.md`
- longer-term concepts go to `VISION.md`
- real usage determines promotion into implementation

---

# D026 — Introduce a 30-day feature freeze after the core is usable

**Status:** Accepted

Once the foundational system works:

Do not substantially redesign it for 30 days.

Record observations:

- Annoying
- Missing
- Ignored
- Helpful
- Confusing
- Surprisingly valuable

At the end of the freeze, use actual evidence to choose the roadmap.

---

# D027 — New features require evidence

**Status:** Accepted

A feature should normally enter `SPEC.md` because:

1. a problem occurred repeatedly
2. the user repeatedly requested it during real use
3. there is clear evidence it reduces friction
4. it is required for a proven workflow

Not because it is intellectually interesting.

---

# D028 — The product should practice its own philosophy

**Status:** Accepted

Year Mission tells the user to:

- narrow priorities
- reduce complexity
- avoid overplanning
- act
- learn from evidence

The software project should follow the same rules.

Prefer:

> fewer features, used consistently

over:

> sophisticated architecture for imagined futures
