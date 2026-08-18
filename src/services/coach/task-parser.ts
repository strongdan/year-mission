import { z } from "zod";
import { getAiProvider } from "@/integrations/ai";
import { DEFERRAL_REASON_Z, type DeferralReason } from "@/domain/constants";

const PARSED_TASK_Z = z.object({
  title: z.string(),
  domain: z.enum(["money", "body", "home", "capability"]).nullable(),
  notes: z.string().nullable(),
  scheduled_date: z.string().nullable(),
  due_date: z.string().nullable(),
  estimated_minutes: z.number().nullable(),
  courage_task: z.boolean(),
});

export type ParsedTask = z.infer<typeof PARSED_TASK_Z>;

const CATEGORIZED_FRICTION_Z = z.object({
  reason: DEFERRAL_REASON_Z,
  note: z.string().nullable(),
});

/**
 * Uses the cheap model for fast structured extraction/classification.
 * Falls back to deterministic parsing when the provider is unavailable.
 */
export class TaskAiParser {
  async parseTask(rawInput: string, today: string): Promise<ParsedTask> {
    const provider = getAiProvider();

    if (provider.name === "mock") {
      return this.fallbackParse(rawInput);
    }

    const todayISO = new Date(today + "T12:00:00").toISOString().slice(0, 10);
    const prompt = `Parse this task capture into JSON. Today is ${todayISO}.
Return ONLY valid JSON matching:
{"title": string, "domain": "money"|"body"|"home"|"capability"|null, "notes": string|null, "scheduled_date": "YYYY-MM-DD"|null, "due_date": "YYYY-MM-DD"|null, "estimated_minutes": number|null, "courage_task": boolean}

Rules:
- Infer domain from content (money/calls about debt = money; exercise/drink = body; house/garage = home; job/skill = capability).
- "tomorrow", "next week", "Friday" etc. map to a concrete date if resolvable.
- courage_task=true for uncomfortable-but-important actions (calls to creditors, asking for things, difficult conversations).

Raw input: ${rawInput}`;

    try {
      const result = await provider.complete({
        messages: [{ role: "user", content: prompt }],
        modelKind: "cheap",
        maxTokens: 300,
      });
      const parsed = extractJson(result.content);
      return PARSED_TASK_Z.parse(parsed);
    } catch {
      return this.fallbackParse(rawInput);
    }
  }

  async categorizeFriction(note: string | null): Promise<{ reason: DeferralReason; note: string | null }> {
    const provider = getAiProvider();
    if (provider.name === "mock") {
      return { reason: "just_avoiding", note: note ?? null };
    }
    const prompt = `Categorize why the user did not do a task into a single reason.
Return ONLY: {"reason": "too_big"|"dont_know_how"|"no_energy"|"not_important"|"blocked"|"just_avoiding", "note": string|null}
User note: ${note ?? "(none)"}`;
    try {
      const result = await provider.complete({ messages: [{ role: "user", content: prompt }], modelKind: "cheap", maxTokens: 100 });
      const parsed = extractJson(result.content);
      return CATEGORIZED_FRICTION_Z.parse(parsed);
    } catch {
      return { reason: "just_avoiding", note: note ?? null };
    }
  }

  private fallbackParse(rawInput: string): ParsedTask {
    const lower = rawInput.toLowerCase();
    const domain = inferDomain(lower);
    const courage = /(call|ask for|raise|creditor|mortgage|bank|payoff|appointment|contractor|difficult conversation|throw away|donate|sell)/i.test(rawInput);
    const words = rawInput.split(/\s+/).length;
    const estimated = words > 12 ? 45 : words > 6 ? 30 : 15;
    return {
      title: rawInput,
      domain,
      notes: null,
      scheduled_date: null,
      due_date: null,
      estimated_minutes: estimated,
      courage_task: courage,
    };
  }
}

function inferDomain(lower: string): ParsedTask["domain"] {
  if (/(debt|money|bank|credit|interest|apartment|bills?|budget|pay)/i.test(lower)) return "money";
  if (/(gym|run|workout|lift|walk|drink|alcohol|cardio|weights|sleep)/i.test(lower)) return "body";
  if (/(garage|house|closet|declutter|donate|repair|clean|organi[sz]e|sell)/i.test(lower)) return "home";
  if (/(resume|interview|portfolio|code|learn|course|ship|deploy|job|career|interview)/i.test(lower)) return "capability";
  return null;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(cleaned.slice(start, end + 1));
}