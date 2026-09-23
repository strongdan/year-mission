import type { SupportIntention } from "./conversation-confidence";

export type SupportResource = {
  id: string;
  title: string;
  creator: string;
  durationMinutes?: number;
  url: string;
  access: "free-download" | "free-stream" | "signup" | "verify";
  intentions: SupportIntention[];
};

// These are source pages only. Year Mission never downloads, mirrors, or stores the audio.
export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    id: "ruth-quietly-confident",
    title: "Quietly Confident",
    creator: "Ruth Anne Lundeberg",
    url: "https://www.theansweriswithinyou.com/self-hypnosis-audio",
    access: "free-stream",
    intentions: ["confidence", "social-ease"],
  },
  {
    id: "ruth-natural-self-expression",
    title: "Natural Self Expression",
    creator: "Ruth Anne Lundeberg",
    url: "https://www.theansweriswithinyou.com/self-hypnosis-audio",
    access: "free-stream",
    intentions: ["self-expression", "confidence"],
  },
  {
    id: "blake-social-ease",
    title: "Social Ease",
    creator: "BlakeTalks",
    url: "https://blaketalks.com/",
    access: "free-stream",
    intentions: ["social-ease", "grounding"],
  },
  {
    id: "freddy-social-anxiety",
    title: "Social Anxiety audio page",
    creator: "Freddy Jacquin",
    url: "https://freddyjacquinhypnosis.com/audios/social-anxiety",
    access: "verify",
    intentions: ["social-ease", "resilience"],
  },
];

export function resourcesForMonth(month: number): SupportResource[] {
  const intentions: SupportIntention[] = month <= 3
    ? ["grounding", "confidence", "social-ease"]
    : month <= 6
      ? ["self-expression", "confidence"]
      : month <= 9
        ? ["social-ease", "resilience"]
        : month <= 11
          ? ["self-expression", "resilience", "confidence"]
          : ["confidence", "social-ease", "self-expression", "resilience", "grounding"];
  return SUPPORT_RESOURCES.filter((resource) => resource.intentions.some((intention) => intentions.includes(intention)));
}
