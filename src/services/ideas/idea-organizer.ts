import { z } from "zod";
import { getAiProviderForRequest } from "@/integrations/ai";

export const ideaTaskSuggestionSchema = z.object({
  title: z.string().min(1).max(240),
  notes: z.string().max(1200).nullable().default(null),
  domain: z.enum(["money", "body", "home", "capability"]).nullable().default(null),
  estimatedMinutes: z.number().int().min(5).max(480).nullable().default(null),
  scheduledDate: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  courageTask: z.boolean().default(false),
});

const organizedIdeaSchema = z.object({
  summary: z.string().min(1).max(500),
  tasks: z.array(ideaTaskSuggestionSchema).max(12),
});

export type IdeaTaskSuggestion = z.infer<typeof ideaTaskSuggestionSchema>;
export type OrganizedIdea = z.infer<typeof organizedIdeaSchema>;

export async function organizeIdea(originalText: string, today: string): Promise<OrganizedIdea> {
  const provider = await getAiProviderForRequest();
  if (provider.name === "mock") return fallbackOrganize(originalText);

  const prompt = `Turn this brain dump into a small set of concrete optional to-dos while preserving the user's original text separately. Today is ${today}.

Return ONLY valid JSON matching:
{"summary": string, "tasks": [{"title": string, "notes": string|null, "domain": "money"|"body"|"home"|"capability"|null, "estimatedMinutes": number|null, "scheduledDate": "YYYY-MM-DD"|null, "dueDate": "YYYY-MM-DD"|null, "courageTask": boolean}]}

Rules:
- Do not rewrite or replace the original brain dump; this output is only an organization layer.
- Extract only actions that are actually implied by the dump. Do not invent commitments.
- Prefer 1-6 useful tasks. Maximum 12.
- Make each task startable and concrete. Split vague multi-step actions when doing so reduces friction.
- Do not turn observations, feelings, questions, or pure ideas into obligations unless an action is clearly implied.
- If there are no actionable items, return an empty tasks array.
- Infer a domain only when clear.
- Translate relative dates only when the text clearly specifies timing.
- courageTask=true only for uncomfortable-but-important actions such as difficult calls, asking for help, negotiations, or avoided conversations.

Brain dump:\n${originalText}`;

  try {
    const result = await provider.complete({
      messages: [{ role: "user", content: prompt }],
      modelKind: "cheap",
      maxTokens: 900,
    });
    return organizedIdeaSchema.parse(extractJson(result.content));
  } catch {
    return fallbackOrganize(originalText);
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function fallbackOrganize(originalText: string): OrganizedIdea {
  const lines = originalText
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);

  const actionable = lines.filter((line) =>
    /^(call|email|text|ask|buy|book|schedule|fix|clean|organize|declutter|pay|review|cancel|renew|research|find|make|build|finish|start|send|return|sell|donate|take|pick up|drop off|check|update|apply|practice|walk|work out|lift|learn)\b/i.test(line)
    || /\b(i need to|i should|remember to|don't forget to|need to|have to)\b/i.test(line),
  );

  const tasks = actionable.slice(0, 8).map((line) => {
    const title = line
      .replace(/^i (?:need to|should|have to)\s+/i, "")
      .replace(/^remember to\s+/i, "")
      .replace(/^don't forget to\s+/i, "")
      .replace(/[.!?]+$/, "")
      .trim();
    return ideaTaskSuggestionSchema.parse({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      notes: null,
      domain: inferDomain(title),
      estimatedMinutes: null,
      scheduledDate: null,
      dueDate: null,
      courageTask: /\b(call|ask|negotiate|conversation|creditor|bank|contractor)\b/i.test(title),
    });
  });

  return {
    summary: tasks.length > 0
      ? `Found ${tasks.length} possible ${tasks.length === 1 ? "to-do" : "to-dos"}. Your original dump remains unchanged.`
      : "No clear to-dos found. The thought is still saved exactly as captured.",
    tasks,
  };
}

function inferDomain(value: string): IdeaTaskSuggestion["domain"] {
  const lower = value.toLowerCase();
  if (/(debt|money|bank|credit|interest|bill|budget|pay|loan|finance)/.test(lower)) return "money";
  if (/(gym|run|workout|lift|walk|sleep|doctor|health|meal|exercise)/.test(lower)) return "body";
  if (/(garage|house|home|yard|closet|declutter|repair|clean|contractor|donate)/.test(lower)) return "home";
  if (/(resume|interview|portfolio|code|learn|course|job|career|skill|project)/.test(lower)) return "capability";
  return null;
}
