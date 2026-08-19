# Year Mission — VISION.md

## Purpose

This document contains the longer-term product vision for Year Mission.

It is intentionally broader than `SPEC.md`.

Items here are **not implementation requirements**.

Do not implement them simply because they are described here.

Promote an idea from `VISION.md` into `SPEC.md` only after real usage demonstrates that it solves a recurring problem or materially improves execution.

---

# Core Vision

Year Mission may eventually become:

> A personal execution system that uses goals, sequencing, evidence, experiments, and behavioral history to help the user determine what deserves attention next while protecting against overcommitment, endless optimization, and unnecessary reinvention.

Its long-term differentiator is not information.

Generic information is abundant.

Its potential value comes from:

- personal context
- behavioral memory
- sequencing
- execution support
- evidence
- pattern recognition
- calibrated AI recommendations
- accumulated self-knowledge

---

# 1. Longitudinal Self-Knowledge

After sufficient usage, the app may discover patterns such as:

- which task sizes are most likely to be completed
- which times/contexts work best for deep technical work
- which Home tasks are repeatedly deferred
- common reasons commitments fail
- whether commitment volume predicts misses
- which recovery strategies work
- which experiments produce measurable improvement
- which types of difficult tasks are increasingly handled sooner

All findings must use cautious language.

Prefer:

> Your history suggests...

Avoid:

> You always...

Do not imply causation from simple correlations.

---

# 2. Personal Operating Manual

After months of real data, the app may produce an evolving document:

## What We Have Learned About You

Potential sections:

- Best working conditions
- Effective task sizes
- Common avoidance patterns
- Commitment capacity
- Best recovery strategies
- Useful routines
- Ineffective routines
- Successful experiments
- Career strengths
- Decision-making patterns
- Recurring friction
- What tends not to work
- Strategies that restore momentum

The user should be able to:

- accept an insight
- reject it
- mark it inaccurate
- add context

AI-generated insights should be traceable to evidence.

---

# 3. Evidence as a First-Class Concept

A future Evidence system could automatically capture meaningful observations.

Examples:

- completed an important task after repeatedly avoiding it
- reached a new lowest consumer-debt balance
- completed a difficult workout despite low motivation
- stayed alcohol-free in a difficult social situation
- solved a difficult production bug
- shipped a substantial technical feature
- kept an important Promise
- completed an uncomfortable phone call
- completed a meaningful house milestone

Potential evidence types:

- sobriety
- fitness
- debt
- home
- career
- reliability
- courage
- avoidance_overcome
- milestone
- personal_best

The long-term psychological purpose is:

> Confidence should increasingly be grounded in accumulated evidence.

---

# 4. Evidence-Driven Identity

The app may eventually make cautious observations about behavior.

Prefer:

> Your last 90 days show increasing follow-through.

or:

> Your recent behavior increasingly supports the description "someone who follows through."

Avoid unsupported affirmations such as:

> You are disciplined.

Identity claims should require:

- sufficient sample size
- multiple observations
- meaningful duration
- inspectable evidence

---

# 5. Career Competency Map

If enough Career Evidence accumulates, introduce two layers.

## Durable Meta-Skills

Potential skills:

- learning
- questioning and reasoning
- written communication
- verbal communication
- negotiation and influence

## Technical Competencies

Potential skills:

- programming
- architecture
- databases
- cloud
- testing
- security
- debugging
- AI-assisted development

Possible progression:

- exposure
- functional
- independent
- strong
- can teach

Progression should require evidence.

Passive course consumption should carry less weight than real-world execution.

---

# 6. Career Confidence Through Evidence

Instead of generic confidence scoring, the app could surface:

> Career Evidence — Last 90 Days

Examples:

- 3 shipped features
- 2 production incidents diagnosed
- 1 architecture proposal
- 4 unfamiliar systems learned
- 2 examples of stakeholder influence

Then make cautious assessments grounded in those facts.

---

# 7. Agency

A future meta-concept:

> Do I increasingly deal with difficult things instead of avoiding them?

Possible inputs:

- uncomfortable tasks completed
- deferred tasks eventually completed
- blocker resolution
- time-to-action on important tasks
- reduction in repeated avoidance

Avoid false precision.

A qualitative presentation may be better than a score.

Example:

> Agency has been strong this month.

---

# 8. Courage / Uncomfortable Tasks

A future task attribute may identify tasks that are unusually uncomfortable but important.

Examples:

- call creditor
- ask for a raise
- schedule an appointment
- submit an application
- request a contractor quote
- inspect debt balances
- discard sentimental clutter
- have a difficult conversation

Potential UI language:

> Uncomfortable but important

rather than fantasy-style gamification.

These actions may generate meaningful Evidence.

---

# 9. Sophisticated Experiment System

V1 experiments are intentionally simple.

A later version may add graded exposure:

```text
Taste
  ↓
Trial
  ↓
Expanded Trial
  ↓
Commitment Test
  ↓
Adopt / Modify / Stop
```

Purpose:

Avoid concluding that liking something at low volume means it should become a major commitment.

Example career transition:

- Taste: explore for a few hours
- Trial: build a small project
- Expanded Trial: ship a substantial project
- Commitment Test: freelance, interview, or repeatedly do real-world work
- Decide from evidence

Potential fields:

- dose_stage
- dose_description
- sessions_planned
- sessions_completed
- weekly_frequency
- total_minutes
- qualitative_result
- next_stage_recommendation

Only build this if the simple experiment system proves insufficient.

---

# 10. Reinvention Protocol

A future structured workflow for major life decisions may use:

```text
Recover
  ↓
Repair
  ↓
Expand Options
  ↓
Experiment
  ↓
Increase Dose
  ↓
Decide
```

The system should not assume dissatisfaction means total reinvention.

## Recover

Could depletion be distorting the decision?

## Repair

Can a specific component be changed without abandoning the whole system?

## Expand Options

Avoid false A/B decisions.

Generate credible C/D/E alternatives.

## Experiment

Prefer reversible tests.

## Increase Dose

Gather more realistic exposure.

## Decide

Use actual evidence.

This can remain primarily a Coach reasoning framework unless repeated use justifies dedicated UI.

---

# 11. Decision Log

A future decision journal could record consequential choices.

Potential fields:

- title
- context
- decision
- reasoning
- confidence
- review_date
- outcome
- outcome_rating

Purpose:

Learn whether decision judgment is improving.

Example:

> Decision: Do not remodel downstairs bathroom before selling.
>
> Reason: Cost unlikely to produce sufficient return.
>
> Confidence: 75%.
>
> Review: February.

Later:

> Was this a good decision?

Only build if actual usage indicates value.

---

# 12. Option Expansion

For large decisions framed as A/B:

> Stay or quit

the Coach may explicitly generate additional options.

Examples:

- internal transfer
- new employer
- temporary leave
- reduced workload
- side experiment
- freelance work
- interview elsewhere
- renegotiate current conditions

The product should help the user escape artificial binary framing.

---

# 13. Reflection-to-Action Detection

A sophisticated version may use behavioral signals to identify excessive planning.

Signals might include:

- many Coach messages about one task
- repeated task decomposition
- repeated requests to optimize an already-actionable task
- plan changes greatly exceeding completed actions
- excessive Meta-Work relative to Life Work

Coach could respond:

> There is enough information to act. Further analysis is unlikely to help right now.

This must be conservative and avoid shutting down legitimate planning.

---

# 14. Meta-Work vs Life Work

Potential long-term distinction:

## Life Work

Real external progress:

- debt paid
- workout completed
- house cleared/repaired
- code shipped
- difficult call made
- technical problem solved

## Meta-Work

Work on the system:

- reorganizing categories
- changing scoring
- repeated planning
- modifying routines
- productivity research
- dashboard customization

Meta-Work is not inherently bad.

But it should contribute little or nothing to Momentum.

The app may eventually notice when Meta-Work starts replacing Life Work.

---

# 15. Execution Only Mode

A future temporary mode could deliberately reduce introspection surfaces.

During `Execution Only`:

Show:

- Today
- What Should I Do?
- active task
- essential progress entry

Hide or de-emphasize:

- long Coach reflection
- Insights
- experiments
- customization
- deep planning

Purpose:

Counter over-analysis.

A successful intervention may result in less app use.

---

# 16. System Stability Windows

The app may eventually encourage trying a reasonable system long enough to evaluate it.

Example:

```text
lifting_program
minimum_evaluation_period = 4 weeks
```

Coach may say:

> The plan has only been running for nine days and adherence is good. There is not enough evidence yet that changing it would improve the result.

This is an anti-novelty mechanism.

---

# 17. Change Budget

A future feature could track major routine/system changes.

Example guideline:

- 1–2 significant system changes per month

The purpose is not to block change.

It is to make constant redesign visible.

---

# 18. App Complexity Monitor

A future internal complexity signal may consider:

- active projects
- active experiments
- recurring commitments
- Today task count
- weekly task count
- custom rules
- active habits

If complexity rises while execution falls:

> Your active system has expanded while completion has declined. Simplification may help.

Only build when there is sufficient evidence that complexity itself is a recurring issue.

---

# 19. Stop Doing

A recurring subtraction workflow may ask:

> What should disappear?

Possible targets:

- task
- project
- habit
- experiment
- recurring expense
- obligation
- possession
- unnecessary house project
- app/service

Potential metric:

> Things removed from your life this year

Do not gamify this excessively.

---

# 20. Stale Backlog Cleanup

A future maintenance feature might surface:

> These 12 items have not been touched in 90 days.

Actions:

- delete
- keep
- activate selected
- archive

Never automatically move stale items into active planning.

---

# 21. Relationship Guardrail

Do not make Relationships a scored fifth domain by default.

A future monthly question may ask:

> Did Year Mission make your important relationships:
>
> Better
> About the same
> Worse

If repeated reviews indicate worsening relationships while output increases, Coach may surface the tradeoff.

Do not overreact to one observation.

---

# 22. Recreation / Enjoyment Guardrail

A lightweight monthly question may ask:

> Did you do anything this month primarily because you enjoyed it?

Answers:

- Yes
- Not much
- No

Do not turn enjoyment into another required habit.

The purpose is to detect self-improvement becoming over-optimization.

---

# 23. Novelty Decay Strategy

Do not solve declining novelty with fake rewards.

Potentially reveal useful capabilities only when enough data exists.

Examples:

- first month review
- first reliable task-size pattern
- quarterly analysis
- six-month behavioral summary
- annual operating manual

The reward should be increasingly useful self-knowledge.

---

# 24. Statistical Insight Engine

If enough data accumulates, the app may answer:

- Which task sizes get finished most often?
- When are Career tasks most successful?
- What reasons explain missed commitments?
- Are Home tasks deferred more when vague?
- Does workload predict missed Promises?
- Which experiments changed actual outcomes?

Require minimum sample thresholds.

Potential defaults:

- task pattern: at least 10 comparable tasks
- friction pattern: at least 5 events
- time/context comparison: enough observations in both groups
- identity inference: multiple evidence types over meaningful time

Centralize thresholds.

---

# 25. Insight Provenance

Any significant AI behavioral insight should be inspectable.

Example:

> Your Home tasks are completed more reliably when they are under 30 minutes.

Expandable:

> Why am I seeing this?

Underlying data:

```text
Home tasks <=30 min:
11 / 14 completed

Home tasks >60 min:
3 / 9 completed
```

Do not generate unsupported psychological narratives.

---

# 26. Year Timeline

A future Year Timeline could show only meaningful events:

- Weekly Wins
- milestones
- personal bests
- debt milestones
- sobriety milestones
- house milestones
- Career Evidence
- avoidance overcome
- important decisions

Do not flood it with ordinary checkboxes.

The result should become a compelling record of change.

---

# 27. Monthly Review Expansion

A later monthly review may contain:

- strongest domain
- neglected domain
- Momentum trend
- Reliability trend
- recurring friction
- successful experiments
- failed experiments
- meaningful Evidence
- tasks removed
- one recommended system adjustment

Limit system recommendations to approximately 1–2 changes.

---

# 28. Quarterly Review

Potential questions:

- Are annual goals still correct?
- Which systems are working?
- Which are not?
- What has been learned about task sizing?
- What has been learned about commitment capacity?
- Which experiments should stop?
- Which Career strengths improved?
- Is the app itself becoming too complicated?
- What should be removed?

The product should be willing to simplify itself.

---

# 29. Annual Review

Potential annual outputs:

## Outcomes

- debt change
- alcohol-free consistency
- weight/fitness
- house readiness
- career evidence

## Execution

- Big Four adherence
- Weekly Wins
- commitment reliability
- deferral patterns

## Self-Knowledge

- strongest working conditions
- recurring friction
- effective recovery strategies
- useful experiments
- commitment capacity

## Career

- durable meta-skills
- technical evidence
- confidence grounded in accomplishments

## Operating Manual

Summarize what actually worked.

---

# 30. Long-Term Product Standard

The app should gradually answer:

1. What actually works for me?
2. How much can I realistically commit to?
3. What do I repeatedly avoid?
4. Which conditions make execution easier?
5. Which experiments produce measurable value?
6. What am I getting better at?
7. Do I increasingly follow through?
8. What should I stop doing?
9. What evidence exists that I am becoming more capable?

But none of this is a reason to overbuild the current product.

The roadmap should come from actual use.
