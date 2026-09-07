# Year Mission — Behavior Resilience Protocol

Last updated: 2026-09-07

## Purpose

Year Mission already contains anti-abandonment mechanisms: Floors, Maintenance and Recovery modes, Momentum that does not reset after one bad day, Promises/Reliability, friction logging, experiments, and resistance handling.

This document extends those mechanisms into a coherent **Behavior Resilience Protocol** for recurring behaviors and difficult commitments.

The design goal is not to build a conventional habit tracker. It is to make important behaviors more likely to happen **even when motivation, energy, attention, schedule, or confidence are imperfect**.

The operating principle is:

> Design the behavior so that ordinary human variability does not become system failure.

---

## Product boundary

Behavior Resilience must remain subordinate to Year Mission's execution system.

Do not turn the product into:

- a generic habit dashboard
- an unlimited recurring-routine manager
- a streak-preservation game
- an identity-affirmation engine
- a shame-based accountability system
- a dense quantified-self interface

Recurring behaviors should exist only when they materially support the current year, season, domain, or maintenance of basic functioning.

The user should have fewer active protocols than they think they could maintain.

---

# 1. Core Behavior Resilience Protocol

An important recurring behavior may have the following conceptual fields:

```text
Behavior
Why it matters
Trigger / cue
Context
Target action
Floor action
Cadence
Weekly success threshold
Action plan
Coping plans
Recovery rule
Environment support
Optional accountability action
Stability window
Review date
```

Example:

```text
Behavior: Evening walk
Why: Supports Body / aerobic base / stress regulation
Trigger: After dinner dishes are cleared
Context: Home, unless traveling
Target: 30-minute walk
Floor: 10-minute walk
Cadence: 4 opportunities per week
Weekly success threshold: 4 completed opportunities; Floor counts as partial continuity
Action plan: If dinner is finished, put on shoes before sitting down
Coping plan: If weather is severe, walk indoors or use treadmill for 10+ minutes
Recovery rule: If an opportunity is missed, resume at the next normal cue; no doubling up
Environment: Shoes and rain shell beside the door
Accountability: Optional Sunday question — “Did you walk after dinner four times?”
Stability window: 4 weeks before redesign unless the plan is clearly unsafe or impossible
```

---

# 2. Implementation intentions: turn intentions into cue-response rules

Use specific **if-then plans** for behaviors where the intention-to-action gap is meaningful.

Prefer:

> If dinner is finished, then I put on my shoes and walk.

Over:

> I should walk more.

Useful cues may include:

- time
- completion of an existing routine
- location
- a calendar event ending
- arriving home
- opening or closing a work session
- a known temptation or high-risk situation

Year Mission should help make the cue concrete rather than merely store a vague intention.

Research reviews generally support implementation-intention/action-planning interventions, although effects vary across contexts. Guided plans with salient cues and periodic reinforcement appear more useful than merely telling people to “make a plan.”

---

# 3. Separate action planning from coping planning

A protocol should be able to answer two different questions:

## Action plan

> When, where, and how will the desired behavior happen?

## Coping plan

> What will happen when the predictable obstacle appears?

Examples:

```text
If I am too tired for the Target, do the Floor.
If weather blocks the outdoor walk, use the indoor option.
If the planned work block is interrupted, use the next protected slot rather than abandoning the week.
If I feel the urge to avoid opening the account balance, open it for two minutes without requiring a full money review.
```

Coping plans should be attached to observed friction where possible instead of creating dozens of speculative rules.

---

# 4. Stable context before arbitrary streak length

For behaviors intended to become more automatic, Year Mission should emphasize **repetition in a stable context** rather than a mythical fixed number of days.

The classic Lally et al. real-world study found very large variation in time to asymptotic automaticity (18–254 days in modeled participants), which is one reason the product should not promise “21 days to form a habit.”

Implications:

- favor the same cue/context when practical
- track repeated opportunities, not just calendar-day streaks
- do not imply a universal habit-formation deadline
- allow difficult behaviors to take months without labeling the process unsuccessful

---

# 5. One lapse is not a reset

An isolated missed opportunity should not reset Momentum, Reliability history, or a behavior's accumulated progress.

The Lally study reported that missing one opportunity did not materially affect the modeled habit-formation process.

Product rule:

> One miss is information, not a verdict.

After an ordinary miss:

- show the next scheduled opportunity
- preserve the existing plan
- do not demand compensation
- do not require doubling up
- do not show a broken-streak state
- do not restart a “day 1” counter

Repeated misses are different: they may indicate a bad cue, an unrealistic target, environmental friction, overcommitment, or a behavior that no longer deserves activation.

---

# 6. Next-opportunity priority instead of “never miss twice” dogma

“Never miss twice” is a useful informal heuristic, but Year Mission should not present it as a scientific law.

Use the more precise rule:

> After a miss, make the next ordinary opportunity especially easy to resume.

This may mean temporarily using the Floor at the next cue.

The purpose is to prevent a lapse from becoming a new default while avoiding guilt or compensatory overcorrection.

---

# 7. Thresholds over perfect streaks

When appropriate, recurring behaviors should be judged over meaningful windows such as a week rather than by uninterrupted daily streaks.

Prefer:

```text
4 of 7 opportunities this week
2 strength sessions this week
1 Money review this week
```

Over:

```text
37-day streak
```

This makes normal disruptions mathematically small and psychologically unremarkable.

A weekly threshold should not become an excuse for late-week binge completion. The protocol may still specify preferred cues and spacing.

---

# 8. Floor / Target / optional Stretch

Year Mission already supports Floor behavior. Extend the model carefully:

```text
Floor   = smallest version that remains genuinely useful
Target  = normal intended dose
Stretch = optional extra work; never required to “make up” for misses
```

Rules:

- Floor must be meaningful, not ceremonial
- Floor completion is not equivalent to Target completion
- Stretch must not increase next-period expectations automatically
- missed work does not create behavioral debt
- do not recommend doubling the next session merely to repair a streak

---

# 9. Environment design and friction shaping

When repeated motivation is required, first ask whether the environment can make the desired behavior easier or the unwanted behavior harder.

Examples:

- shoes and rain gear visible by the door
- workout equipment already set out
- distracting sites blocked during a focus session
- alcohol or tempting foods not kept in the default environment when that supports the user's chosen goal
- required materials opened before the scheduled work block
- automatic transfer or scheduled reminder for a Money action when appropriate

Environment changes should be practical and reversible.

The Coach should prefer reducing friction over repeatedly telling the user to use more willpower.

---

# 10. Prevention before resistance

For predictable temptations or distractions, Year Mission should distinguish:

## Prevention

Reduce exposure before temptation is active.

## Resistance

Try to overcome temptation after it is already present.

When prevention is safe and realistic, it usually places less demand on moment-to-moment self-control.

Examples:

```text
Prevention: put the phone in another room before a focus block.
Resistance: repeatedly decide not to open social media while the phone is beside you.
```

Do not create coercive controls or lockouts by default.

---

# 11. Optional commitment devices

For high-value behaviors where the user repeatedly requests stronger guardrails, Year Mission may eventually support lightweight commitment devices.

Examples:

- pre-book a class
- schedule a calendar block with a specific action
- ask another person to check a concrete result
- temporarily block a known distraction
- put a required item somewhere that creates a useful physical prompt

Requirements:

- user initiated
- reversible where practical
- proportional to the behavior
- no punitive money-loss mechanics by default
- no escalating coercion

Commitment devices should be treated as tools, not proof of discipline.

---

# 12. Temptation bundling

An optional tactic is to pair an immediately enjoyable activity with a delayed-benefit behavior.

Examples:

- favorite podcast only during a walk
- audiobook during repetitive home cleanup
- preferred music during mobility work

Evidence from field experiments suggests temptation bundling can increase the desired behavior, though effects can decay over time.

Use it as an optional experiment, not as a permanent dependency or universal rule.

---

# 13. Accountability should focus on actions, not premature identity

Social accountability is not inherently good or bad; how it is framed matters.

Prefer concrete behavioral accountability:

> Ask me Sunday whether I completed two strength sessions.

Over identity declarations:

> I am becoming an athlete.

Research on publicly noticed identity-related intentions found reduced subsequent action in some experiments, potentially because recognition created a premature sense of identity completion.

Year Mission should therefore:

- avoid encouraging public identity declarations as a default tactic
- allow optional accountability around observable actions
- record the behavior, not applause
- treat identity as something cautiously inferred from accumulated evidence over time

This is consistent with the existing Evidence-Driven Identity vision.

---

# 14. Evidence-earned identity

Year Mission may eventually reflect identity-like observations only after repeated evidence exists.

Prefer:

> You completed 14 of your last 17 planned walks.

Then, if useful:

> Your recent behavior increasingly supports the description “someone who walks consistently.”

Avoid:

> You are disciplined.

Identity should be downstream of reps, not a substitute for them.

---

# 15. Recovery language and self-compassion

After a lapse, use neutral and constructive language.

Experiments on self-compassion after mistakes/failure have found increases in self-improvement motivation compared with several control conditions.

Product implications:

- avoid moralized failure language
- distinguish a missed behavior from a failed person
- ask what happened only when useful
- redirect toward the next opportunity
- preserve accountability without shame

Example:

> Yesterday was missed. Nothing needs to be repaid. Your next planned opportunity is tonight after dinner.

---

# 16. Fresh starts as restart affordances, not procrastination deadlines

Temporal landmarks such as a new week or month can increase aspirational behavior.

Year Mission can use this effect lightly:

- weekly review may offer a clean reset of plan expectations
- a new season can be a useful recommitment point
- after disruption, the next morning/week may be framed as a restart

But do not encourage:

> I already messed up Monday, so I will restart next week.

The nearest feasible opportunity is normally better than waiting for a ceremonial date.

---

# 17. Stability windows and boosters

Do not continually redesign a behavior that has not had enough exposure to evaluate.

A protocol may define a **stability window**, such as 2–6 weeks, during which the plan remains substantially unchanged unless:

- it is unsafe
- the context changes materially
- the cue is clearly impossible
- repeated friction provides strong contrary evidence

Periodic lightweight boosters may restate the cue and coping plan without creating more planning work.

This extends the existing System Stability Window concept.

---

# 18. Repeated friction means revise the system

The same obstacle recurring should trigger plan diagnosis rather than stronger self-criticism.

Potential deterministic rule:

```text
If the same friction reason occurs >= 3 times in 14 days
for the same recurring behavior,
recommend reviewing the cue, Floor, context, or cadence.
```

Examples:

- `forgot` repeatedly → cue/prompt problem
- `too_tired` repeatedly → timing or Target problem
- `too_big` repeatedly → resize Target/Floor
- `blocked` repeatedly → resolve dependency before scheduling
- `competing_priority` repeatedly → overcommitment or bad slot
- `did_not_feel_like_it` repeatedly → environment, reward, or commitment support may help
- `not_important` repeatedly → deactivate the behavior

Do not treat every isolated friction event as requiring a redesign.

---

# 19. Context changes should trigger re-anchoring

Habits depend partly on cues and context. Travel, schedule changes, illness, school calendars, job changes, house projects, and seasonal daylight can disrupt otherwise stable routines.

When context changes materially:

- do not interpret temporary disruption as evidence the behavior itself failed
- identify a new cue
- use the Floor temporarily if needed
- re-establish the behavior in the new context

A context change is often a protocol migration problem, not a motivation problem.

---

# 20. Success should be outcome-aware

A behavior can be executed consistently and still fail to advance the intended outcome.

Year Mission should eventually distinguish:

```text
Adherence: Did the protocol happen?
Outcome: Is the underlying domain moving?
```

Example:

- strength sessions completed consistently
- but no strength progression for months

That should trigger an experiment or plan review, not ever-higher adherence demands.

---

# 21. Stop rules

Recurring behaviors should be easy to deactivate.

Consider stopping or parking when:

- it no longer supports a current goal
- repeated evidence shows low value
- the outcome is already maintained without active tracking
- another behavior replaces it
- the maintenance cost exceeds the benefit

The product must not accumulate permanent rituals merely because they were once useful.

---

# 22. Behavior graduation

A protocol that has become reliable and low-friction may graduate from active attention.

Possible states:

```text
planned
active
maintenance
background
paused
retired
```

“Background” means the behavior no longer deserves prominent Today real estate unless adherence deteriorates or context changes.

Do not require the user to keep checking off mature automatic behaviors forever.

---

# 23. Coach behavior

The Coach should be able to reason about behavior protocols using stored evidence.

Useful jobs:

- turn a vague intention into an if-then action plan
- identify likely cues
- create one or two coping plans from observed friction
- recommend a meaningful Floor
- diagnose repeated misses
- distinguish motivation problems from environment/timing problems
- recommend deactivation when the behavior is not valuable
- resist unnecessary plan redesign inside the stability window
- propose an experiment when evidence is genuinely ambiguous

The Coach should not:

- generate generic motivational speeches
- moralize lapses
- insist on perfect streaks
- add many new habits at once
- infer deep psychological causes from a few misses

---

# 24. Today UX

Behavior protocols should not turn Today into a large routine checklist.

Guidelines:

- surface only behavior opportunities relevant now
- normally show no more than a small number of recurring items alongside intentional tasks
- use the existing Floor affordance when needed
- after a miss, show the next cue rather than an overdue punishment
- if the weekly threshold is already satisfied, reduce prominence unless extra work is explicitly useful
- mature/background protocols should largely disappear from Today

---

# 25. Progress UX

Do not center Progress around streak counts.

Potential useful summaries:

```text
Walks: 4 / 4 opportunities this week
Strength: 2 / 2 this week
Evening routine: 11 / 14 recent opportunities
Recovery after misses: resumed at next opportunity 5 / 6 times
```

Use trends and windows rather than “back to zero.”

Avoid false precision around automaticity.

---

# 26. Weekly Review integration

Keep review burden low.

For active protocols, ask only when evidence suggests a need:

- Did the behavior happen often enough?
- What repeatedly got in the way?
- Does the cue still fit real life?
- Is the Target too large?
- Is the Floor still meaningful?
- Does this behavior still deserve active attention?

Normally recommend no more than one or two system changes per review.

---

# 27. Conceptual data model

Do **not** create this schema merely because it appears here. Promote only the minimum fields required by an active workflow.

Possible future model:

```text
behavior_protocols
  id
  user_id
  domain_id nullable
  title
  why_text nullable
  status
  cue_type
  cue_text
  context_text nullable
  target_text
  floor_text nullable
  cadence_json
  weekly_threshold nullable
  recovery_rule
  stability_until nullable
  created_at
  updated_at

behavior_coping_plans
  id
  protocol_id
  trigger_text
  response_text
  source_friction_reason nullable
  active

behavior_events
  id
  protocol_id
  opportunity_at
  outcome: target | floor | missed | skipped_not_applicable
  friction_reason nullable
  context_json nullable
  created_at
```

Prefer extending existing task/friction/event structures if that remains simpler than introducing separate tables.

---

# 28. Deterministic behavior rules

Candidate rules should remain testable outside React and AI.

```text
Single miss
  → no reset
  → next normal opportunity

Repeated same friction
  → suggest protocol review

Target unrealistic today
  → offer Floor

Weekly threshold met
  → reduce urgency; do not create artificial extra work

Context changed
  → re-anchor cue before judging adherence

Behavior stable and low-friction
  → consider background/graduation

Behavior repeatedly low-value
  → suggest stop/park
```

---

# 29. Staged implementation

## Stage A — Product semantics

- adopt this document
- align Coach language with lapse/recovery rules
- keep existing no-streak-shame behavior
- use existing friction, Floor, Recovery, Reliability, and experiment concepts

## Stage B — Minimal protocol support

Only after promotion into `SPEC.md`:

- store cue, Target, Floor, cadence, threshold, and recovery rule
- add deterministic evaluation logic and tests
- reuse existing friction data where possible

## Stage C — Today / Weekly Review integration

- surface only currently relevant opportunities
- next-opportunity recovery
- low-noise threshold summaries
- protocol review only when evidence warrants it

## Stage D — Longitudinal self-knowledge

Only after sufficient data:

- effective cues
- successful recovery strategies
- context sensitivity
- realistic cadence
- repeated friction
- graduation/deactivation suggestions

Do not build Stage D from sparse data.

---

# 30. Acceptance principles

A Behavior Resilience implementation is successful when:

- one missed opportunity never produces a “back to zero” experience
- recurring behavior can be defined with a concrete cue
- Target and Floor are distinct
- recovery is preplanned
- repeated friction can change the plan
- weekly thresholds can replace brittle streak logic
- accountability can target observable actions
- environment and coping strategies are considered before exhorting more willpower
- mature behaviors can disappear from active attention
- inactive/low-value behaviors can be stopped easily
- Today remains small
- AI advice remains evidence-grounded and non-authoritative

---

## Research basis

The product should treat behavioral research as guidance rather than universal law. Relevant sources include:

1. Lally P, van Jaarsveld CHM, Potts HWW, Wardle J. **How are habits formed: Modelling habit formation in the real world.** European Journal of Social Psychology. 2010;40:998–1009. DOI: https://doi.org/10.1002/ejsp.674
2. Hagger MS, Luszczynska A. **Implementation intention and action planning interventions in health contexts: state of the research and proposals for the way forward.** Applied Psychology: Health and Well-Being. 2014;6(1):1–47. PMID: https://pubmed.ncbi.nlm.nih.gov/24591064/
3. Scholz U, Schüz B, Ziegelmann JP, Lippke S, Schwarzer R. **Beyond behavioural intentions: planning mediates between intentions and physical activity.** British Journal of Health Psychology. 2008. PMID: https://pubmed.ncbi.nlm.nih.gov/17553212/
4. Gollwitzer PM, Sheeran P, Michalski V, Seifert AE. **When intentions go public: does social reality widen the intention-behavior gap?** Psychological Science. 2009;20(5):612–618. PMID: https://pubmed.ncbi.nlm.nih.gov/19389130/
5. Breines JG, Chen S. **Self-compassion increases self-improvement motivation.** Personality and Social Psychology Bulletin. 2012;38(9):1133–1143. PMID: https://pubmed.ncbi.nlm.nih.gov/22645164/
6. Dai H, Milkman KL, Riis J. **The Fresh Start Effect: Temporal Landmarks Motivate Aspirational Behavior.** Management Science. 2014;60(10):2563–2582. DOI: https://doi.org/10.1287/mnsc.2014.1901
7. Milkman KL et al. **Temptation bundling** field experiment. NBER project summary: https://www.nber.org/roybal/6418-evaluation-temptation-bundling
8. Zhang CQ et al. **The Effectiveness of Planning Interventions for Improving Physical Activity in the General Population: A Systematic Review and Meta-Analysis of Randomized Controlled Trials.** 2022. PMID: https://pubmed.ncbi.nlm.nih.gov/35742582/

Evidence strength and applicability differ by behavior, population, and intervention. Year Mission should therefore keep the deterministic rules modest, expose uncertainty where appropriate, and learn from the user's own longitudinal evidence.
