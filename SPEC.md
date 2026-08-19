# Year Mission — SPEC.md

## Purpose

Year Mission is a private, mobile-first personal execution system for a one-year plan across four domains:

- Money
- Body
- Home
- Career

The app exists to help the user **actually do the right things, in the right order, long enough for meaningful change to occur**.

It is not primarily a habit tracker, productivity dashboard, or conventional to-do list.

The main product question is:

> What is the highest-value realistic thing to do next?

The app should reduce cognitive load, prevent backlog overwhelm, and turn intentions into concrete execution.

---

## Product Principles

### 1. Accumulation over intensity

The year succeeds through consistent, imperfect progress.

Do not design around perfect days, perfect streaks, or maximal adherence.

### 2. Never make the user feel behind

Avoid:

- giant overdue lists
- red overdue counters
- broken-streak shame
- punitive scoring
- excessive reminders
- walls of unfinished tasks

When a plan slips, help determine the next useful move.

### 3. Reduce choice near execution

The closer the user gets to doing something, the fewer options should be visible.

Conceptually:

```text
Annual goals
    ↓
Season
    ↓
Monthly focus
    ↓
This Week
    ↓
Today
    ↓
Now
```

At **Now**, normally recommend one action.

### 4. Tasks are commitments, not intentions

Capturing an idea must not automatically make it an active obligation.

Use:

```text
Inbox → This Week → Today → Done
```

Projects and an Ideas/Later area may exist, but neither should clutter Today.

### 5. Planning must lead to action

Once the next physical action is sufficiently clear, additional planning should receive diminishing priority.

The Coach should be able to say:

> The next action is already clear. More planning is unlikely to help right now.

### 6. AI advises; application code owns state

AI may recommend, rank, summarize, decompose, and propose changes.

AI must not receive unrestricted database mutation capability.

Meaningful changes follow:

```text
AI proposal → validation → user approval when appropriate → application code → database
```

### 7. Optimize for real-world outcomes, not engagement

A successful interaction may last 30 seconds.

Closing the app and doing the task is a positive outcome.

---

# 1. Target Platform

Primary:

- iPhone

Secondary:

- desktop browser
- mobile browser

Build as:

- Next.js
- TypeScript
- Progressive Web App
- mobile-first responsive UI
- standalone installable PWA

Deployment:

- Vercel

Database and auth:

- Supabase PostgreSQL
- Supabase Auth
- Google OAuth

External task integration:

- Google Tasks API

AI:

- provider abstraction
- initially OpenAI
- inexpensive model for parsing/classification
- stronger small model for coaching

Do not make the core domain logic dependent on one model vendor.

---

# 2. Primary Navigation

Keep primary navigation small.

Recommended:

- Today
- Tasks
- Progress
- Coach

Secondary features such as planning, settings, reviews, experiments, or insights should not compete for primary navigation.

---

# 3. Today Screen

This is the most important screen.

The user should spend most app time here.

Show:

1. current season
2. current monthly focus
3. Weekly Win
4. Big Four status
5. approximately 3–5 Today tasks
6. `What Should I Do?`
7. Minimum/Floor option when appropriate

Do not show the full backlog.

Do not show every metric.

Do not turn Today into a dashboard.

---

# 4. Four Domains

Initial domains:

## Money

Primary annual objective:

Reduce expensive consumer debt as aggressively and sustainably as practical.

## Body

Primary annual objectives:

- alcohol-free
- lose 20+ lb
- improve strength
- improve aerobic fitness

## Home

Primary annual objective:

Prepare the house to be sellable/list-ready.

## Career

Primary annual objective:

Develop enough demonstrated competence and career evidence that employability feels grounded in evidence rather than hope.

The labels and objectives must be editable.

---

# 5. Annual Structure

Initial seasonal structure:

## Season 1 — Stabilize

Approx. August–October

Themes:

- sobriety
- baseline
- environment
- financial control

## Season 2 — Build

Approx. November–January

Themes:

- strength
- decluttering
- technical evidence

## Season 3 — Transform

Approx. February–April

Themes:

- nutrition
- cardio
- high-value house projects

## Season 4 — Convert

Approx. May–August

Themes:

- professional market-readiness
- house completion
- financial sprint
- consolidation

Do not hard-code the app permanently around these exact dates or names.

---

# 6. Weekly System

The weekly operating system matters more than the annual plan.

Default Big Four:

## Body

2 intentional workouts

## Money

1 focused money review/action

## Home

1 focused house block

## Career

1 focused career/technical block

Track whether each was completed during the week.

Do not turn every optional wellness activity into a required habit.

---

# 7. Weekly Win

Each week may contain one high-impact outcome:

`Weekly Win`

Examples:

- clear garage workbench
- make major debt payment
- ship meaningful technical feature
- finish a specific house repair

The Weekly Win should be visible on Today and in the weekly review.

It should carry more significance than arbitrary microtasks.

---

# 8. Task Model

Core flow:

```text
Inbox → This Week → Today → Done
```

Additional state may include:

- backlog
- in_progress
- dropped

## Today limit

Default maximum:

5 intentional tasks

When Today is full, adding another task should require deliberate replacement or explicit override.

## This Week limit

Recommended:

approximately 10–12 meaningful tasks

Do not enforce this as a brittle hard rule initially, but warn against overload.

---

# 9. Task Fields

Suggested minimum task fields:

```text
id
user_id
project_id nullable
domain
title
notes nullable
status
estimated_minutes nullable
impact
scheduled_date nullable
due_date nullable
weekly_commitment boolean
weekly_win boolean
defer_count
created_at
updated_at
completed_at nullable
```

Do not over-model before actual usage justifies it.

---

# 10. Task Events

Maintain useful task history.

Suggested table:

```text
task_events
```

Fields:

```text
id
user_id
task_id
event_type
event_data jsonb
created_at
```

Useful events:

- created
- scheduled
- started
- deferred
- resized
- avoidance_recorded
- completed
- dropped

This history enables later self-knowledge without requiring sophisticated analytics in V1.

---

# 11. Deferral and Friction

Repeated deferral is information.

When a meaningful task is ignored or deferred, provide an optional low-friction reason:

- Too big
- No energy
- Forgot
- Blocked
- Don't know how
- Not important
- Just avoiding it
- Something else

Do not require a journal entry.

Persist the reason as task history.

---

# 12. "I Don't Want to Do This"

Provide a first-class task action:

> I don't want to do this

Then ask what is getting in the way.

Suggested responses:

### Too big

Offer to reduce or split the task.

### Don't know how

Offer Coach help or a concrete research step.

### No energy

Offer a smaller version or different task.

### Not important

Offer to drop or park the task.

### Blocked

Record the blocker.

### Just avoiding it

Offer a short starting session, such as 10 minutes.

---

# 13. What Should I Do?

This is a core product feature.

The user may optionally provide:

- available time
- energy: low / medium / high

The app should return ONE recommended task.

Example:

> **Fill one donation box from the garage**
>
> 20 minutes · Home
>
> Home is this month's focus, and this task has already been deferred twice.

Actions:

- Start
- Give me something else
- I don't want to do this
- Why this?

Do not return a list of ten recommendations.

---

# 14. Initial Sequencing Logic

Keep V1 sequencing intentionally simple and deterministic.

Prioritize approximately:

1. Weekly Win
2. important time-sensitive obligations
3. tasks aligned with current monthly focus
4. incomplete Big Four commitments
5. meaningful repeatedly deferred tasks
6. other active work

Then filter or adjust for:

- blockers
- available time
- energy
- current week mode
- task size

Avoid complex AI ranking until actual usage reveals a need.

---

# 15. Why This?

Explain recommendations using deterministic reasons when possible.

Example:

> Why this?
>
> - Home is the current monthly focus.
> - It advances the Weekly Win.
> - It fits the 25 minutes you have.
> - It has no blocker.
> - You have deferred it twice.

Do not call an LLM merely to produce this explanation.

---

# 16. Start / Execution Mode

After pressing Start, reduce distraction.

Show:

- task
- concrete next action
- optional timer
- target duration

Actions:

- Done
- Continue
- Stop here
- I'm stuck

Do not show the full backlog during focused execution.

---

# 17. Floor Behavior

Support a meaningful fallback when the intended task or behavior is not realistic today.

Examples:

```text
Workout
Floor: 10 minutes
Target: full workout

Home
Floor: 10-minute physical action
Target: 60-minute block

Career
Floor: one concrete technical action
Target: 60–90 minute focused session

Walking
Floor: 10-minute walk
Target: normal daily movement goal
```

Floor completion should count, but should not equal full Target completion.

Do not create meaningless streak-preservation behaviors.

---

# 18. Minimum Day

Maintain a simple fallback definition for chaotic days.

Initial version:

- no alcohol
- walk for 10 minutes
- do one useful thing

The app should support reduced expectations without labeling the day a failure.

---

# 19. Week Modes

Keep this simple.

Supported modes:

- normal
- maintenance
- recovery

`push` may be added later if useful.

## Normal

Normal targets.

## Maintenance

Protect core commitments while external workload is high.

## Recovery

Floor behaviors may constitute successful execution.

Do not punish Maintenance or Recovery weeks.

---

# 20. Progress Screen

Only display metrics that materially matter.

Initial metrics:

- consumer debt
- alcohol-free days
- weight trend
- workouts/week
- average steps
- house readiness
- Career Evidence
- simple Momentum indicator

Do not build a massive quantified-self dashboard.

---

# 21. Momentum

Momentum is a rough indicator that meaningful movement is occurring.

Do not over-engineer the formula.

Inputs may include:

- Big Four completion
- Weekly Win completion
- meaningful task completion
- consistency
- progress metrics

Missing one day must not reset Momentum.

Meta-work should contribute little or nothing.

Do not expose false precision.

A categorical presentation such as:

- Low
- Rebuilding
- Steady
- Strong

may be preferable to a highly precise number.

---

# 22. Reliability

Track deliberate commitments or Promises when useful.

A Promise is stronger than an ordinary task.

Example:

> Saturday at 9 AM I will spend 60 minutes clearing the garage.

Possible states:

- active
- kept
- renegotiated
- missed
- cancelled

Intentional renegotiation before the commitment should be treated differently from silent failure.

Reliability exists to answer:

> Do I increasingly do what I deliberately say I will do?

Do not make it punitive.

---

# 23. Weekly Review

Target duration:

5–15 minutes.

Ask:

1. What went well?
2. What did not happen?
3. Why?
4. What should I stop doing?
5. Did I overcommit?
6. What is next week's Weekly Win?
7. What is the most important action for each domain?

Domains:

- Money
- Body
- Home
- Career

Optional AI summary may follow the user's review.

Do not turn this into a long journaling exercise.

---

# 24. Career Evidence

Do not build a complex competency taxonomy initially.

Create a simple Career Evidence log.

Examples:

- shipped meaningful feature
- solved difficult production problem
- learned unfamiliar technology and used it
- wrote useful technical proposal
- handled difficult stakeholder discussion
- completed an open-source contribution
- performed well in interview practice
- deployed a real application

Fields:

```text
id
user_id
date
title
description
type nullable
url nullable
```

After sufficient evidence accumulates, AI may organize it into broader competencies later.

Do not pre-build that taxonomy.

---

# 25. Experiments

Keep experiments lightweight.

Example:

```text
Experiment: Morning workouts

Hypothesis:
I will exercise more consistently if I exercise before work.

End date:
September 30

Result:
...

Decision:
Keep / Change / Stop
```

Default maximum active experiments:

2

Do not implement complex experiment-dose state machines yet.

The Coach may conversationally suggest increasing or decreasing exposure.

---

# 26. Ideas / Later

Provide a parking lot for interesting ideas that are not active commitments.

Examples:

- side project
- new habit
- learning goal
- new training method
- lifestyle experiment

Items in Ideas:

- do not affect Momentum
- do not affect Reliability
- do not appear in Today
- should not create guilt

The Coach should frequently prefer:

> Not now

over activating another commitment.

---

# 27. AI Coach

The Coach has access to relevant portions of:

- annual goals
- current season
- monthly focus
- Weekly Win
- Big Four
- Today tasks
- active This Week tasks
- recent deferrals
- friction reasons
- recent progress
- recent weekly reviews
- active experiments
- Career Evidence

Do not send the entire database on every request.

Build a compact context packet.

---

# 28. Primary Coach Jobs

The Coach should be particularly good at:

- What should I do now?
- Break this task down.
- Why do I keep avoiding this?
- Help me plan this week.
- Review my month.
- Help me reduce scope.
- Challenge unnecessary complexity.
- Help me choose what not to do.

The Coach should not primarily generate generic motivational advice.

---

# 29. Reflection-to-Action Rule

Add this to the Coach system prompt:

> Once a useful insight has produced a sufficiently clear next physical action, further reflection should receive diminishing priority.

If repeated planning occurs around an already-actionable task, redirect toward execution.

Example:

> We already have a clear next action: fill one donation box for 15 minutes. More planning is unlikely to improve the outcome right now.

Do not use this when:

- the task is genuinely ambiguous
- meaningful blockers remain
- the user is asking for necessary factual information

---

# 30. Coach May Disagree

The Coach should not automatically endorse every new idea.

Add:

> Optimize for the user's stated annual outcomes and sustainable execution, not for satisfying every request.

Identify:

- overcommitment
- complexity creep
- avoidance through planning
- unnecessary experimentation
- conflicting priorities

Example:

> This is a reasonable idea, but it does not directly advance the current annual priorities. I recommend parking it rather than activating it now.

Keep disagreement calm and evidence-based.

---

# 31. Reinvention Guidance

Do not build a full Reinvention subsystem in V1.

Put this reasoning into Coach instructions.

For major life-change questions, consider:

1. Recover
2. Repair
3. Expand options
4. Run a reversible experiment
5. Decide from evidence

Avoid binary framing.

When someone asks:

> Stay or quit?

consider additional credible options.

Prefer reversible tests before irreversible commitments.

This is AI guidance, not a new database-heavy workflow.

---

# 32. AI Action Safety

AI should return structured proposals for data-changing actions.

Example:

```json
{
  "action": "reschedule_task",
  "task_id": "abc123",
  "new_date": "2026-08-21",
  "reason": "The task has been deferred twice and better fits Friday."
}
```

Validate with Zod.

Application code performs approved actions.

For important changes, require explicit approval.

---

# 33. AI Cost Strategy

Use AI only where language/reasoning adds value.

Do NOT call AI for:

- marking tasks complete
- calculating progress
- basic sequencing
- updating metrics
- normal CRUD
- deterministic sync

Use a cheap model for:

- task parsing
- classification
- summarization

Use a stronger small model for:

- coaching
- prioritization when deterministic logic is insufficient
- reflection
- decomposition
- weekly/monthly analysis

Track:

- model
- input tokens
- output tokens
- estimated cost
- latency
- errors

---

# 34. Google Tasks Integration

Supabase remains canonical.

Google Tasks is an interoperability layer.

Create or use a dedicated task list such as:

`Year Mission`

Sync simplified fields:

- title
- notes
- due date
- completion

Retain richer Year Mission metadata only in Supabase.

Suggested sync metadata:

```text
task_id
google_task_id
google_tasklist_id
local_updated_at
google_updated_at
sync_status
last_synced_at
```

Initial sync behavior:

- pull on app open/foreground
- push local task changes
- reconcile conflicts deterministically

Do not encode the full Year Mission data model into Google Tasks.

---

# 35. Database

Use Supabase PostgreSQL.

Suggested initial tables:

```text
profiles
plans
domains
seasons
monthly_focuses
projects
tasks
task_events
weekly_reviews
daily_checkins
financial_snapshots
career_evidence
experiments
promises
ai_conversations
ai_messages
ai_proposals
google_connections
google_task_sync
```

Do not create speculative tables merely because a future feature might need them.

Use migrations.

Use Row Level Security for user-owned data.

---

# 36. Security

Never expose client-side:

- Supabase service role key
- AI provider API keys
- Google OAuth secrets
- Google refresh tokens

Google integration credentials should remain server-side.

Use Supabase RLS for user isolation.

Validate all server inputs.

---

# 37. PWA Requirements

Implement:

- manifest
- proper icons
- standalone display
- iOS safe-area handling
- service worker
- offline application shell
- cached static assets

Online connectivity is required for:

- AI
- cloud sync
- Google Tasks sync

Local interactions should remain responsive through optimistic UI where safe.

---

# 38. UX Direction

Tone:

- calm
- serious
- adult
- modern
- restrained
- mobile-first

Avoid:

- cartoon achievements
- fake currency
- loud confetti
- leaderboards
- excessive progress animations
- childish streak mechanics

Use subtle progress and meaningful milestones.

---

# 39. Gamification

Keep gamification restrained.

Initial mechanisms:

- Momentum
- Weekly Win
- visible domain progress
- meaningful milestones
- Career Evidence
- personal bests when naturally available

Do not add XP or coins.

Do not reward app interaction itself.

Reward evidence of real-world progress.

---

# 40. Explicit Non-Goals for V1

Do NOT build yet:

- sophisticated behavioral analytics
- Agency scoring
- detailed career competency maps
- Personal Operating Manual
- complex experiment-dose workflows
- relationship scoring
- elaborate Decision Log
- statistical insight engine
- feature-unlock system
- complex identity inference
- extensive notification engine
- social functionality
- leaderboards
- native iOS application
- financial account aggregation
- calorie database
- large self-help content library

These belong in `VISION.md` or `IDEAS.md`.

---

# 41. Implementation Phases

## Phase 1 — Foundation

Build:

- Next.js PWA
- Supabase
- Google login
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

Add:

- What Should I Do?
- deterministic sequencing
- Why This?
- execution mode
- deferral/friction reasons
- Floor fallback
- Reliability/Promises if actual use warrants it

## Phase 3 — Integrations

Add:

- Google Tasks OAuth
- two-way synchronization
- conflict handling
- sync diagnostics

## Phase 4 — Evidence-Driven Enhancements

Only after sustained real usage.

Review actual behavior before choosing features from `VISION.md`.

---

# 42. Feature Freeze

After the core system becomes usable:

> Do not substantially redesign the product for 30 days.

During this period, record:

- Annoying
- Missing
- Ignored
- Helpful
- Confusing
- Surprisingly valuable

Do not immediately implement every observation.

At the end of the period, use actual usage evidence to choose the next changes.

---

# 43. Feature Admission Rule

Do not build a feature merely because it sounds useful.

A new feature should normally require at least one of:

1. a repeated real-world problem
2. a repeated user request during actual usage
3. clear evidence that the feature reduces friction
4. a required dependency for a proven workflow

Otherwise:

> Park it.

---

# 44. Engineering Requirements

Use:

- TypeScript strict mode
- Zod validation
- database migrations
- testable domain logic
- server-side secrets
- clear service boundaries
- accessible semantic UI
- responsive mobile design
- optimistic updates where safe

Avoid:

- giant React components
- business rules scattered through UI code
- unrestricted AI database access
- duplicated task-state logic
- provider-specific AI logic throughout the application
- speculative abstractions

Prefer simple code that is easy to change.

---

# 45. Testing

Unit tests:

- Today limit
- sequencing
- blocked tasks excluded
- available-time filtering
- Weekly Win priority
- deferral tracking
- friction logging
- Floor behavior
- AI action validation
- Google conflict resolution

Integration tests:

- auth
- Supabase CRUD + RLS
- AI proposal → approval → mutation
- Google sync

E2E:

1. login
2. add Inbox task
3. move to This Week
4. move to Today
5. complete
6. verify persistence
7. rapid consecutive updates
8. record progress
9. complete weekly review
10. ask Coach
11. approve AI proposal
12. AI failure preserves data
13. What Should I Do returns a valid action
14. mobile PWA viewport

---

# 46. Final Standard

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
