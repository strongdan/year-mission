// Curated guidance, not a diagnostic tool or a validated twelve-month treatment protocol.
// Keep the plan public-safe: personal reflections remain in owner-scoped preferences.
export const CONFIDENCE_ANCHOR =
  "I can make a mistake, repair what needs repairing, and stay on my own side as I return to life.";

export const CONFIDENCE_RECOVERY_STEPS = [
  {
    title: "Notice the alarm",
    prompt: "Name the rush of fear or shame. Take one comfortable breath if helpful, and look back toward the situation. You can choose your next action while the feeling is present.",
    example: "There is that rush of shame. I can take this one step at a time.",
  },
  {
    title: "Name what happened",
    prompt: "Describe the observable event in one plain sentence. Separate it from guesses about what other people think. Ask what consequence actually needs attention.",
    example: "I interrupted. I do not know what they think of me.",
  },
  {
    title: "Repair what needs repair",
    prompt: "Correct the fact, apologize when warranted, or make a realistic plan to put things right. Keep the response proportionate. You do not owe a speech attacking your character.",
    example: "I jumped in. Please finish. / You are right; I had that wrong.",
  },
  {
    title: "Rejoin the moment",
    prompt: "Listen to the answer, continue the task, or take the next useful step. Returning counts even if embarrassment remains. There is no recovery timer or requirement to feel amused.",
    example: "That was a mistake. What needs doing now?",
  },
] as const;

export const CONFIDENCE_HUMOR_EXAMPLES = [
  "Well, that sentence took an unexpected turn. Let me try again.",
  "Apparently I was very confident about the wrong answer.",
  "Oops. A neutral response is enough; laughter is optional.",
] as const;

export const CONFIDENCE_ROADMAP = [
  {
    month: 1,
    title: "Recover without turning against yourself",
    focus: "Begin with ordinary moments of fear or shame after a perceived mistake. Practice noticing, describing, repairing, and returning. Social participation starts this week.",
    practices: [
      "Choose three meaningful outcomes for the year: more freedom to participate, a closer connection, or an activity you want to try. These are directions rather than performance requirements.",
      "If fear or self-criticism limits daily life, arrange an assessment with a clinician who understands social anxiety. Discuss attention difficulties or persistent low mood if relevant; the app does not diagnose them.",
      "Use the recovery guide after one small mistake that happens naturally. Do not manufacture a consequential error as an exercise.",
      "If hypnosis appeals to you, discuss the optional four-to-six-week trial below. Start small real-world actions alongside it.",
    ],
    milestone: "You can notice the alarm and take a useful next step, even while uncomfortable.",
    weeklyActions: [
      "Begin one brief conversation in a familiar setting.",
      "After one ordinary stumble, make any needed repair and continue.",
    ],
    skill: "That was a mistake. What needs doing now?",
    reflection: "Was there a moment when I stayed on my own side after something went wrong?",
  },
  {
    month: 2,
    title: "Approach manageable imperfection",
    focus: "Give yourself chances to act without perfect certainty. Choose low-stakes steps that feel challenging but workable.",
    practices: [
      "Make a short ladder of things you want to do: begin a conversation, allow a pause, express an opinion, offer an invitation, or speak to a group.",
      "For one selected practice, briefly note what you predict and compare it with what actually happened. Allow uncertainty when the result is unclear.",
      "Choose genuine, respectful participation. Avoid dangerous errors, humiliating challenges, or deliberately inconveniencing people.",
      "Review the hypnosis trial after four to six weeks. Keep, change, or stop it based on everyday usefulness, time, and cost.",
    ],
    milestone: "You approach more often without waiting to feel completely ready.",
    weeklyActions: [
      "Ask one genuine question before its wording feels perfect.",
      "Allow one ordinary pause and return attention to the other person.",
    ],
    skill: "I can act with uncertainty present.",
    reflection: "What did I learn from acting rather than rehearsing longer?",
  },
  {
    month: 3,
    title: "Listen, contribute, and repair",
    focus: "Practice mutual conversation with one cue at a time. Your interests and enthusiasm deserve room alongside the other person's.",
    practices: [
      "Let the other person finish, then respond to the point they just made. If you interrupt, give the floor back with a brief repair.",
      "Ask a follow-up that interests you, listen to the answer, and share something related. Avoid turning the exchange into an interview.",
      "Bring attention back when it wanders. Perfect presence, sustained eye contact, and a prescribed amount of talking are not required.",
      "If useful, ask a trusted person for one specific piece of feedback about listening rather than a global judgment of your likability.",
    ],
    milestone: "Some conversations feel more mutual, and an interruption is easier to notice and repair.",
    weeklyActions: [
      "Listen through one conversational turn and respond to its last point.",
      "Share one genuine thought and allow the response to be ordinary.",
    ],
    skill: "Let them finish; respond to their last point.",
    reflection: "What helped me give another person room while also being myself?",
  },
  {
    month: 4,
    title: "Close the replay gently",
    focus: "Respond fairly after awkwardness. Keep useful learning while letting the rest of your day continue.",
    practices: [
      "For one or two selected interactions, briefly ask what happened, what you assumed, and whether one useful adjustment is needed.",
      "When a memory returns, acknowledge it without reopening the whole investigation. Return to a chosen activity; the feeling can take its own time to settle.",
      "Try a credible compassionate response: That was uncomfortable. I can correct anything necessary without attacking myself.",
      "Use warm humor only when natural and appropriate. A neutral Oops is enough, and harm to another person needs a repair first.",
    ],
    milestone: "An uncomfortable interaction takes less of the rest of your day, without pressure to recover on a schedule.",
    weeklyActions: [
      "After one stumble, identify one useful lesson and close the review.",
      "Enjoy an activity with no self-improvement assignment attached.",
    ],
    skill: "I can learn from this without putting myself on trial.",
    reflection: "Did I return to life with less self-punishment, even if the feeling stayed?",
  },
  {
    month: 5,
    title: "Give friendship room to grow",
    focus: "Build continuity with people whose company you enjoy. Notice mutual interest over time.",
    practices: [
      "Choose one or two people you would like to know better. Offer a modest, specific invitation connected to an activity you already enjoy.",
      "Share an ordinary preference, interest, or small difficulty when it fits the relationship. Allow closeness to develop gradually.",
      "Notice whether the other person asks questions, follows up, or suggests alternatives. Respect a decline and invest where interest is reciprocal.",
      "A declined invitation is an outcome of that invitation. You do not need to solve what every acquaintance thinks of you.",
    ],
    milestone: "There is more continuity with a few people, including conversations that pick up where the last one ended.",
    weeklyActions: [
      "Offer one simple invitation to someone whose company you enjoy.",
      "Follow up naturally on something a familiar person previously shared.",
    ],
    skill: "I can offer connection and leave room for another person's choice.",
    reflection: "Where did connection feel mutual or worth another small step?",
  },
  {
    month: 6,
    title: "Express preferences and boundaries",
    focus: "Make your needs and views visible through clear, respectful requests and ordinary disagreement.",
    practices: [
      "State a preference, ask for clarification, decline an optional commitment, or request a specific change.",
      "Begin with reasonable people and proportionate stakes. Keep yourself safe in relationships where disagreement has real consequences.",
      "Explain what is useful without repeatedly arguing for permission to have a preference.",
      "If someone seems annoyed, check whether there is a real problem to address. Uncertain reactions can remain uncertain; actual harm deserves attention.",
    ],
    milestone: "Your preferences are more visible, and you can remain engaged through some disagreement.",
    weeklyActions: [
      "State one small preference directly and respectfully.",
      "Make one realistic request or decline one optional commitment.",
    ],
    skill: "I can be considerate and still have a point of view.",
    reflection: "Where did I express what mattered without abandoning myself?",
  },
  {
    month: 7,
    title: "Build confidence through ownership",
    focus: "Develop trust in your ability to understand, learn, decide, and ask for help. Keep commitments small enough to be realistic.",
    practices: [
      "Choose one useful skill or piece of work to understand more clearly. Try a manageable part and identify what help you need.",
      "Explain what you learned in your own words. Tools and AI can help; comprehension and ownership are the goal.",
      "Make one small reversible decision without repeatedly polling others for reassurance.",
      "If you miss a commitment, acknowledge it and choose a realistic repair. Competence grows through practice, while your worth is not conditional on the result.",
    ],
    milestone: "You can point to concrete examples of learning, handling a problem, or getting help effectively.",
    weeklyActions: [
      "Work through a manageable problem and explain what you understand.",
      "Make one small reversible decision using your own judgment.",
    ],
    skill: "I can attempt, learn, and ask for the help I actually need.",
    reflection: "What did I understand or handle more independently this month?",
  },
  {
    month: 8,
    title: "Make room for expression and play",
    focus: "Choose a shared activity because the experience interests you. Let yourself be a learner in public.",
    practices: [
      "Try one setting for expression: music, dancing, a speaking group, improv, a class, or another shared interest.",
      "If an open mic appeals, attend as an audience member and prepare something short. Another personally meaningful activity is equally valid.",
      "Allow small visible imperfections when the stakes are low. Enjoyment is part of the purpose.",
      "Use the recovery guide after a stumble. You do not have to make a joke or win approval to stay involved.",
    ],
    milestone: "You participate in an experience you want, even while being seen feels uncomfortable.",
    weeklyActions: [
      "Take one small step into an activity that feels expressive or playful.",
      "Share a short, unfinished piece or idea with a trusted person when useful.",
    ],
    skill: "I am allowed to be a learner and enjoy this.",
    reflection: "What felt alive, enjoyable, or worth trying again?",
  },
  {
    month: 9,
    title: "Take a meaningful visible step",
    focus: "Choose a stretch that matters to you and break it into workable stages.",
    practices: [
      "Perform a short piece, give a brief presentation, host a simple gathering, lead an activity, or share something you made.",
      "For an open mic, possible steps are attending, practicing privately, sharing with one person, and trying a short performance. Change the goal if it no longer matters.",
      "Define success as the participation you choose. Another person's reaction is not fully within your control.",
      "Afterward, allow yourself to enjoy having participated. Make any needed repair, then keep review to one useful lesson.",
    ],
    milestone: "You have taken a meaningful step that you previously kept imagining or postponing.",
    weeklyActions: [
      "Complete one workable stage of your chosen visible activity.",
      "After a small stumble, acknowledge it and continue the activity.",
    ],
    skill: "I can let people see me trying something that matters.",
    reflection: "What did participating make possible?",
  },
  {
    month: 10,
    title: "Carry the practice into different settings",
    focus: "Use the same skills with different people and ordinary changes in mood or preparation.",
    practices: [
      "Try a familiar small step in another setting, with another person, or with less rehearsal.",
      "Occasionally practice without a calming ritual beforehand. Hypnosis and grounding can remain optional supports.",
      "Allow most conversations to be ordinary life. Only selected moments need a review or evidence entry.",
      "If a new context is difficult, choose a smaller approach and reuse the recovery sequence.",
    ],
    milestone: "Participation depends less on having the ideal setting, preparation, or mood.",
    weeklyActions: [
      "Repeat a useful practice with a different person or in a new setting.",
      "Make an ordinary contribution without extensively rehearsing it.",
    ],
    skill: "I can bring these skills with me as circumstances change.",
    reflection: "Where did I participate under less-than-ideal conditions?",
  },
  {
    month: 11,
    title: "Return after a difficult week",
    focus: "Notice withdrawal early and resume with a manageable step. A setback can prompt adjustment without a complete redesign.",
    practices: [
      "Identify personal signals such as avoiding messages, canceling plans, replaying conversations, or repeatedly seeking reassurance.",
      "Write a brief return plan: notice the pattern, choose one smaller action, reconnect with someone trustworthy, and reuse what helped.",
      "On a demanding week, one small approach and one fair response to yourself are enough. There is no backlog of missed practice to repay.",
      "If fear, shame, or persistent low mood substantially interferes with life, review support with a qualified professional.",
    ],
    milestone: "A difficult week leads to a smaller return step rather than abandonment or self-punishment.",
    weeklyActions: [
      "Reconnect with one person or activity after noticing withdrawal.",
      "Choose a tiny version of a useful action when capacity is low.",
    ],
    skill: "I can return from where I am today.",
    reflection: "What helped me return, and what support would make returning easier?",
  },
  {
    month: 12,
    title: "Keep a sustainable relationship with yourself",
    focus: "Keep the relationships, experiences, and practices that help. Let deliberate confidence work become smaller as everyday participation grows.",
    practices: [
      "Look for concrete changes in avoidance, attention, recovery after mistakes, and freedom to express yourself. Do not calculate a confidence grade.",
      "Notice which relationships became more mutual and which activities made life more enjoyable.",
      "Choose a small maintenance routine and stop tracking what no longer helps. Occasional professional follow-up may remain useful.",
      "Keep kindness and proportionate responsibility together. You can keep learning without making yourself an endless improvement project.",
    ],
    milestone: "Life has more connection, enjoyment, and choice, with fewer routines to maintain.",
    weeklyActions: [
      "Choose one activity or relationship you want to keep making room for.",
      "Keep one useful practice and let go of one unhelpful tracking habit.",
    ],
    skill: "I can be imperfect and remain present in my life.",
    reflection: "What can I do now that I used to avoid, and what deserves less attention?",
  },
] as const;

export const CONFIDENCE_METHODS = [
  {
    name: "Social-anxiety-focused CBT and gradual practice",
    evidence: "Strongest direct support here for persistent fear of social judgment. A clinical guideline recommends individual CBT designed specifically for social anxiety.",
    role: "A clinician can help test feared predictions, reduce avoidance, and address self-focused attention and replay. Assessment determines fit; ordinary awkwardness is not itself a diagnosis.",
    sourceIds: ["nice-social-anxiety", "cbt-review", "exposure-learning"],
  },
  {
    name: "Acceptance and commitment therapy (ACT)",
    evidence: "Supported by trials, with mixed comparisons against CBT. The evidence does not establish it as generally superior.",
    role: "Notice a thought such as They find me boring, make room for uncertainty, and choose a small action that matters to you.",
    sourceIds: ["act-trial", "act-comparison"],
  },
  {
    name: "Self-compassion",
    evidence: "A meta-analysis found a meaningful reduction in self-criticism, with variation across studies and limitations in quality.",
    role: "Respond fairly after mistakes while taking responsibility for any repair. A brief kind phrase is a practical adaptation, not the full program studied in trials.",
    sourceIds: ["compassion-review"],
  },
  {
    name: "Specific conversation skills",
    evidence: "A trial found benefits in observed social skills and general clinical status when skills training was added to exposure. Follow-up-question research also supports responsiveness in conversation.",
    role: "Practice one skill at a time: letting a turn finish, a natural follow-up, mutual sharing, invitations, or a clear request. There is no formula that guarantees liking.",
    sourceIds: ["social-skills-trial", "follow-up-questions"],
  },
  {
    name: "Hypnosis or guided self-hypnosis",
    evidence: "Promising for anxiety across mixed contexts. A small recent social-anxiety study found improvement with both hypnosis and relaxation; lasting everyday confidence and superiority were not established.",
    role: "An optional, time-limited support for attention, tension, and realistic rehearsal. Review whether it helps participation outside sessions.",
    sourceIds: ["hypnosis-review", "hypnosis-comparison"],
  },
  {
    name: "Mindfulness and everyday foundations",
    evidence: "Structured mindfulness programs have trial support for social anxiety. Adequate sleep, enjoyable movement, and supportive relationships can also support mental health.",
    role: "Briefly notice a thought and return attention to the conversation. Protect rest and enjoyable movement. A brief exercise is not equivalent to a studied mindfulness course or a replacement for needed care.",
    sourceIds: ["mindfulness-trial", "nimh-social-anxiety"],
  },
] as const;

export const CONFIDENCE_HYPNOSIS_TRIAL = {
  summary: "If hypnosis appeals to you, use it as an optional starting aid alongside real-world practice. The goal is more freedom to participate and recover after a mistake.",
  duration: "Agree on a small trial with a qualified clinician and review it after four to six weeks. This is a practical review window, not a proven treatment dose.",
  practice: "If advised, a manageable home example is about ten minutes three times a week. Rehearse a small stumble, noticing the alarm, making any repair, and continuing. You do not have to feel calm first.",
  targets: [
    "Begin a conversation despite anticipatory nerves.",
    "Let another person finish and tolerate an ordinary pause.",
    "Return to participation after a mistake without attacking yourself.",
  ],
  reviews: [
    "Am I approaching situations more often?",
    "Can I stay engaged and recover with less self-punishment?",
    "Does the benefit outside sessions justify the time and cost?",
    "Keep, change, or stop. If it mainly helps relaxation, value it for that while reviewing the main behavioral approach.",
  ],
  practitionerQuestions: [
    "Are you a licensed mental-health professional who treats anxiety and has formal clinical-hypnosis training?",
    "Do you use social-anxiety-focused CBT and behavioral practice, and how could hypnosis support those goals?",
    "How will we review change outside sessions and decide whether to continue?",
  ],
  safeguards: [
    "Participation stays voluntary. You retain agency and can interrupt or stop hypnosis.",
    "Avoid recovered-memory or age-regression claims; hypnosis is not a reliable way to establish accurate memories.",
    "Use recordings only in a safe setting, never while driving or doing something that needs alert attention.",
    "If distress increases, stop and discuss it with a qualified clinician. Ask them to assess whether this approach is appropriate for you.",
    "Start real-world practice in week one. Listening is not a prerequisite, completion target, or substitute for participation.",
  ],
} as const;

export const CONFIDENCE_WEEKLY_RHYTHM = [
  { when: "Monday · about five minutes", action: "Choose two small real-world actions and one skill to keep in mind. Use the current month for ideas." },
  { when: "Twice during the week", action: "Try the chosen actions in situations already available to you. Make them smaller if needed." },
  { when: "Optional starting trial", action: "Use the hypnosis practice agreed with your clinician, if wanted. It creates no streak or practice debt." },
  { when: "One selected interaction", action: "Briefly compare what you expected with what happened. Keep at most one useful lesson, then return to life." },
  { when: "Monthly · about ten minutes", action: "Review participation, attention, recovery, and expression using examples. Repeat, advance, pause, or stop by choice." },
  { when: "A demanding week", action: "One tiny approach and one fair response to yourself are enough. Keep some enjoyable time free of improvement assignments." },
] as const;

export const CONFIDENCE_REVIEW_PROMPTS = [
  "Participation: What did I do that I previously avoided?",
  "Attention: When was more of my attention available for another person?",
  "Recovery: When did I return after a mistake with less self-punishment, even if embarrassment remained?",
  "Expression: Where did I state a preference, contribute, ask, or allow myself to be known?",
  "Connection and enjoyment: Which people or activities made life feel more mutual or alive?",
  "Keep, change, or stop: What helps, and what can I stop tracking?",
] as const;

export const CONFIDENCE_FIRST_WEEK = [
  "If useful, contact one qualified therapist about fear of judgment, the shame response after mistakes, and possible hypnosis alongside CBT.",
  "Choose two small actions in familiar settings: a brief conversation and a chance to participate despite uncertainty.",
  "Practice one cue: Let them finish; respond to their last point.",
  "After one ordinary stumble, ask what happened, make any needed repair, and return to the next useful action.",
  "Take five minutes on Monday to choose the next two actions. Progress does not require perfect adherence.",
] as const;

export const CONFIDENCE_ADJUSTMENTS = [
  "Repeatedly avoiding a step? Make it smaller and examine what you predict will happen.",
  "Taking action but replaying it for hours? Bring the replay process into the work rather than only increasing the challenge.",
  "Tracking makes you more self-conscious? Reduce it. Most interactions do not need a record.",
  "Still embarrassed after a repair? Count returning as useful. There is no deadline for the feeling to disappear.",
  "Hypnosis is not helping everyday participation? Review whether to keep, change, or stop it.",
  "Little improvement after several weeks of consistent work? Review the approach and support with a qualified clinician instead of simply demanding more effort.",
  "Anxiety or persistent low mood substantially interferes with daily life? Seek professional help now. Discuss treatment options, including medication when appropriate, rather than waiting for the year to end.",
] as const;

export const CONFIDENCE_PRACTICE_TOOLS = [
  {
    title: "Separate observation from interpretation",
    steps: [
      "Name what you observed: They gave a brief answer.",
      "Notice the interpretation: They find me boring.",
      "Allow an accurate uncertainty: I do not know what that meant. I can let the conversation end naturally.",
    ],
    example: "A declined invitation means this invitation did not work out. Notice the broader pattern of reciprocity and respect the answer.",
  },
  {
    title: "Follow up and contribute",
    steps: [
      "Listen for something that actually interests you.",
      "Ask a relevant follow-up and leave room for the answer.",
      "Share something connected from your own experience.",
    ],
    example: "You said you started skiing again. How has that been? Then respond to the answer and contribute something of your own.",
  },
  {
    title: "Kindness with correction",
    steps: [
      "Describe a specific behavior rather than your whole character.",
      "Take responsibility for any effect on another person.",
      "Choose one repair or adjustment, then continue.",
    ],
    example: "I interrupted because I was excited. I can give them space and practice doing it differently.",
  },
  {
    title: "Make room for ordinary enjoyment",
    steps: [
      "Keep some sport, music, time outdoors, or time with people free of improvement assignments.",
      "Choose activities for their own value rather than to prove confidence.",
      "Use AI for occasional planning or rehearsal without asking it to judge every ambiguous encounter.",
    ],
    example: "For this walk or conversation, I can simply participate. There is nothing to log.",
  },
] as const;

export const CONFIDENCE_RESTART_PLAN =
  "When I notice myself withdrawing, I will choose one smaller approach step, reconnect with someone I trust, and return to the practices that helped. I can ask for support and resume from where I am.";

export const CONFIDENCE_SOURCES = [
  { id: "nice-social-anxiety", title: "NICE: social anxiety assessment and treatment recommendations", url: "https://www.nice.org.uk/guidance/cg159/chapter/recommendations" },
  { id: "cbt-review", title: "Mayo-Wilson et al. (2014): social-anxiety treatment systematic review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4287862/" },
  { id: "exposure-learning", title: "Craske et al. (2014): learning through exposure", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4114726/" },
  { id: "act-trial", title: "Craske et al. (2014): CBT and ACT randomized trial", url: "https://pubmed.ncbi.nlm.nih.gov/24999670/" },
  { id: "act-comparison", title: "Herbert et al. (2018): ACT and CBT comparison", url: "https://doi.org/10.1016/j.jcbs.2018.07.008" },
  { id: "compassion-review", title: "Wakelin et al. (2022): self-compassion and self-criticism review", url: "https://pubmed.ncbi.nlm.nih.gov/33749936/" },
  { id: "social-skills-trial", title: "Beidel et al. (2014): social skills added to exposure", url: "https://pubmed.ncbi.nlm.nih.gov/25445081/" },
  { id: "follow-up-questions", title: "Huang et al. (2017): follow-up questions and responsiveness", url: "https://pubmed.ncbi.nlm.nih.gov/28447835/" },
  { id: "follow-up-correction", title: "2025 correction: substantive question-asking results unchanged", url: "https://pubmed.ncbi.nlm.nih.gov/40111841/" },
  { id: "liking-gap", title: "Boothby et al. (2018): uncertainty about how conversations are received", url: "https://doi.org/10.1177/0956797618783714" },
  { id: "hypnosis-review", title: "Valentine et al. (2019): hypnosis for anxiety meta-analysis", url: "https://pubmed.ncbi.nlm.nih.gov/31251710/" },
  { id: "hypnosis-comparison", title: "Ma et al. (2026): hypnosis and progressive muscle relaxation", url: "https://pubmed.ncbi.nlm.nih.gov/43035195/" },
  { id: "hypnosis-practitioner", title: "American Society of Clinical Hypnosis: choosing a practitioner", url: "https://asch.net/about-hypnosis/" },
  { id: "hypnosis-memory", title: "Cedars-Sinai: hypnosis, agency, and memory recovery", url: "https://www.cedars-sinai.org/health-topics/hypnosis" },
  { id: "mindfulness-trial", title: "Goldin et al. (2016): structured mindfulness and group CBT trial", url: "https://pubmed.ncbi.nlm.nih.gov/26950097/" },
  { id: "nimh-social-anxiety", title: "NIMH: social anxiety and professional support", url: "https://www.nimh.nih.gov/health/publications/social-anxiety-disorder-more-than-just-shyness" },
  { id: "cci-workbook", title: "Free workbook: Stepping Out of Social Anxiety", url: "https://www.cci.health.wa.gov.au/resources/looking-after-yourself/social-anxiety" },
] as const;
