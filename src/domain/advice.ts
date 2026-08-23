export type AdviceCategory =
  | "focus"
  | "personal_growth"
  | "strength"
  | "mobility"
  | "movement"
  | "nutrition"
  | "recovery"
  | "meditation";

export interface AdviceItem {
  id: string;
  category: AdviceCategory;
  title: string;
  body: string;
  action?: string;
}

export const ADVICE_CATEGORY_LABELS: Record<AdviceCategory, string> = {
  focus: "Focus & procrastination",
  personal_growth: "Personal development",
  strength: "Strength",
  mobility: "Stretching & mobility",
  movement: "Walking & cardio",
  nutrition: "Diet & weight loss",
  recovery: "Recovery & consistency",
  meditation: "Meditation & hypnosis",
};

export const ADVICE_ITEMS: AdviceItem[] = [
  { id: "focus-next-action", category: "focus", title: "Shrink the start", body: "When a task feels vague, define the next physical action. Starting should require less interpretation than avoiding it.", action: "Name one action you can do in under five minutes." },
  { id: "focus-five-minutes", category: "focus", title: "Use a five-minute bridge", body: "You do not need to commit to finishing. Commit to five minutes of contact with the task; continuation can be a separate decision.", action: "Start the five-minute timer instead of deciding whether you feel motivated." },
  { id: "focus-avoidance", category: "focus", title: "Avoidance is information", body: "Repeated deferral usually points to size, uncertainty, low energy, a blocker, or simple aversion. Diagnose the friction instead of treating the task as a moral test." },
  { id: "focus-implementation", category: "focus", title: "Attach behavior to a cue", body: "Simple if-then rules remove a decision: after lunch, walk; after opening the repo, run the first test; after dinner, begin the evening reset.", action: "Choose one reliable cue for the behavior you keep forgetting." },
  { id: "focus-imperfect", category: "focus", title: "Act before certainty", body: "Waiting to feel fully ready gives avoidance unlimited veto power. A deliberately imperfect first pass is often the fastest route to clarity." },
  { id: "focus-visible", category: "focus", title: "Make the useful action easier to see", body: "Reduce activation energy: leave the link, equipment, document, or next command ready before the moment you need it." },
  { id: "focus-return", category: "focus", title: "Reward the return", body: "Coming back to a task after avoiding it is valuable evidence. Treat the return as a skill you are training, not proof that the earlier deferral ruined anything." },
  { id: "focus-one-thing", category: "focus", title: "One target beats ten options", body: "When attention is scattered, reduce the choice set. Pick one useful action that fits the time and energy actually available." },

  { id: "growth-evidence", category: "personal_growth", title: "Confidence follows evidence", body: "Self-trust grows when you repeatedly collect proof that you can start, adapt, finish, recover, and keep promises realistically." },
  { id: "growth-accumulation", category: "personal_growth", title: "Accumulation beats intensity", body: "A year changes through many decent weeks, not a few heroic days. Protect repeatability before trying to maximize effort." },
  { id: "growth-courage", category: "personal_growth", title: "Count uncomfortable action", body: "A useful confidence metric is not how certain you felt. It is whether you acted on something meaningful while discomfort was present." },
  { id: "growth-self-correction", category: "personal_growth", title: "Correct without attacking yourself", body: "The productive response to a miss is diagnosis and adjustment: what happened, what should shrink, and what is the next useful move?" },
  { id: "growth-overthinking", category: "personal_growth", title: "Initiative is trainable", body: "When analysis has stopped producing new information, choose the smallest reversible action and learn from reality." },
  { id: "growth-imperfection", category: "personal_growth", title: "Practice being unfinished", body: "Long-term capability grows faster when imperfect drafts, awkward practice, and partial progress are allowed to exist." },
  { id: "growth-stop", category: "personal_growth", title: "Dropping can be disciplined", body: "If a task is genuinely unimportant, removing it is better than repeatedly carrying it as evidence of failure." },
  { id: "growth-renegotiate", category: "personal_growth", title: "Renegotiate before you disappear", body: "Changing a commitment deliberately is different from silently missing it. Realistic promises build more self-trust than ambitious promises you cannot sustain." },

  { id: "strength-two", category: "strength", title: "Two good lifts are enough to build from", body: "Protect two intentional strength sessions each week before adding complexity. Consistency creates the platform for progressive overload." },
  { id: "strength-short", category: "strength", title: "Use the short version on crowded days", body: "A 15-minute session can preserve the training habit and provide useful stimulus. Do not make a 45-minute window the price of admission." },
  { id: "strength-progress", category: "strength", title: "Progress one variable", body: "When form is stable, add a rep, a little load, or occasionally a set. You do not need to redesign the whole program to progress." },
  { id: "strength-substitute", category: "strength", title: "Substitute the movement pattern", body: "Missing equipment should change the exercise, not cancel the session. Preserve the squat, push, pull, hinge, carry, or core pattern with what is available." },
  { id: "strength-clean-reps", category: "strength", title: "Leave a little in reserve", body: "Most routine sets do not need to become tests of will. Clean repeatable reps make it easier to train again and to judge progression." },
  { id: "strength-record", category: "strength", title: "Record enough to beat last time", body: "A simple log of load and reps is more useful than a complicated training diary if it helps you make the next session slightly better." },

  { id: "mobility-sequence", category: "mobility", title: "Follow a sequence instead of choosing stretches", body: "The evening routine should remove decisions. Start the guided sequence and let the timer tell you when to change positions." },
  { id: "mobility-floor", category: "mobility", title: "Five minutes is a legitimate floor", body: "When the full mobility session is unrealistic, use a short version instead of turning the night into all-or-nothing." },
  { id: "mobility-mild", category: "mobility", title: "Do not force range", body: "Mobility work is easier to repeat when the sensation stays tolerable enough for normal breathing and controlled movement." },
  { id: "mobility-specific", category: "mobility", title: "Match the routine to the day", body: "Lower body, upper body and spine, down-regulation, yoga flow, and restore sessions can rotate without becoming separate habits to manage." },
  { id: "mobility-transition", category: "mobility", title: "Automate transitions", body: "A countdown between movements removes the easiest place to drift into your phone or stop early." },

  { id: "movement-average", category: "movement", title: "Use an average, not a punitive streak", body: "Daily movement targets work better as a rolling average. One low day does not require punishment or a heroic catch-up." },
  { id: "movement-postmeal", category: "movement", title: "Borrow ten minutes after meals", body: "A short walk after lunch or dinner is easy to cue and can serve movement, decompression, and routine building at the same time." },
  { id: "movement-bundle", category: "movement", title: "Bundle walking with something you already want", body: "Phone calls, podcasts, audiobooks, errands, or outdoor time can make walking feel less like another obligation." },
  { id: "movement-long", category: "movement", title: "Keep one longer easy outing", body: "A weekly 60–90 minute walk can overlap with recreation and does not have to feel like formal training." },
  { id: "movement-enjoyable-cardio", category: "movement", title: "Cardio should be repeatable", body: "Choose an aerobic activity you can imagine continuing: hiking, cycling, swimming, running, or another enjoyable option." },

  { id: "nutrition-protein", category: "nutrition", title: "Protein first simplifies meals", body: "You do not need perfect macro tracking. Making a meaningful protein source the anchor of meals reduces one recurring decision." },
  { id: "nutrition-produce", category: "nutrition", title: "Add before subtracting", body: "Including fruit or vegetables with most meals is often easier to sustain than building a long list of forbidden foods." },
  { id: "nutrition-drinks", category: "nutrition", title: "Keep routine drinks simple", body: "Reducing habitual caloric drinks is a low-friction change that does not require weighing food or calculating every meal." },
  { id: "nutrition-grazing", category: "nutrition", title: "Prefer meals over constant grazing", body: "A clearer meal rhythm can reduce repeated food decisions and make evening boundaries easier to keep." },
  { id: "nutrition-environment", category: "nutrition", title: "Use the environment", body: "If a food repeatedly triggers automatic eating, making it less available is often more reliable than repeatedly winning a willpower contest." },
  { id: "nutrition-trend", category: "nutrition", title: "Judge weight by trend", body: "Individual weigh-ins are noisy. Use a rolling average and wait for a real multi-week plateau before changing the plan." },
  { id: "nutrition-one-change", category: "nutrition", title: "Change one lever at a time", body: "If progress is flat for several weeks, make one modest adjustment and observe it before stacking additional restrictions." },
  { id: "nutrition-convenience", category: "nutrition", title: "Convenience can improve adherence", body: "A simple protein-and-fiber option or other convenient default is useful when it replaces a higher-friction choice rather than becoming extra intake." },

  { id: "recovery-all-or-something", category: "recovery", title: "Use all-or-something", body: "When the ideal session will not fit, choose a smaller useful version. Flexibility protects continuity better than a rule that converts disruption into zero." },
  { id: "recovery-mode", category: "recovery", title: "Lower the bar before you break the system", body: "Maintenance and Recovery modes are deliberate capacity decisions. They are not failed Normal weeks." },
  { id: "recovery-miss", category: "recovery", title: "A miss is data", body: "One miss is noise. Repetition is the signal. Adjust only when a pattern appears instead of rewriting the plan after a difficult day." },
  { id: "recovery-backup", category: "recovery", title: "Pre-plan the backup", body: "For important routines, decide the short version before you need it. Busy-day decisions are easier when the fallback already exists." },
  { id: "recovery-stability", category: "recovery", title: "Do not improve what is already working", body: "Novelty can feel productive, but stable routines need time to become automatic. Prefer keeping the plan when adherence and outcomes are acceptable." },

  { id: "meditation-default", category: "meditation", title: "Use a default meditation", body: "A one-tap five-minute session is more useful than a large meditation library if browsing becomes another way to delay starting." },
  { id: "meditation-return", category: "meditation", title: "Returning is the repetition", body: "The practice is not keeping attention perfectly still. Noticing drift and returning is the actual rep." },
  { id: "meditation-evening", category: "meditation", title: "Chain the evening routine", body: "Stretching, slow breathing, meditation, and hypnosis work better as one sequence than as four independent habits competing for attention." },
  { id: "meditation-hypnosis", category: "meditation", title: "Use hypnosis as rehearsal, not magic", body: "Repeated listening can support attention, self-regulation, and behavioral rehearsal. Judge it by whether useful behavior changes, not by how dramatic the session feels." },
  { id: "meditation-safe", category: "meditation", title: "Keep hypnosis context safe", body: "Only listen when you can give it your attention in a safe setting. You remain able to pause or stop the session at any time." },
];

export function adviceForCategory(category: AdviceCategory): AdviceItem[] {
  return ADVICE_ITEMS.filter((item) => item.category === category);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailyAdvice(date = new Date()): AdviceItem {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return ADVICE_ITEMS[hashString(key) % ADVICE_ITEMS.length];
}

export function randomAdvice(category?: AdviceCategory): AdviceItem {
  const pool = category ? adviceForCategory(category) : ADVICE_ITEMS;
  return pool[Math.floor(Math.random() * pool.length)] ?? ADVICE_ITEMS[0];
}
