"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  insertIdea,
  insertTaskEvent,
  listDomains,
  listIdeas,
  updateIdea,
} from "@/repositories/supabase-repository";
import { taskService } from "@/services/task-service";
import {
  ideaTaskSuggestionSchema,
  organizeIdea,
} from "@/services/ideas/idea-organizer";

const captureSchema = z.object({
  originalText: z.string().trim().min(1).max(20_000),
});

const createTasksSchema = z.object({
  ideaId: z.string().uuid(),
  tasks: z.array(ideaTaskSuggestionSchema).min(1).max(12),
});

function titleFromDump(value: string): string {
  const first = value.split(/\n|(?<=[.!?])\s+/)[0]?.trim() || "Untitled thought";
  return first.length > 90 ? `${first.slice(0, 87).trimEnd()}…` : first;
}

function revalidateIdeaSurfaces() {
  for (const path of ["/ideas", "/tasks", "/", "/coach"]) revalidatePath(path);
}

export async function captureIdeaAction(rawInput: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const parsed = captureSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, error: "Write or dictate something first." };

  const originalText = parsed.data.originalText;
  const idea = await insertIdea({
    user_id: user.id,
    title: titleFromDump(originalText),
    notes: originalText,
    status: "parked",
  });
  revalidateIdeaSurfaces();
  return { ok: true as const, data: idea };
}

export async function organizeIdeaAction(ideaId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const ideas = await listIdeas(user.id);
  const idea = ideas.find((candidate) => candidate.id === ideaId);
  if (!idea) return { ok: false as const, error: "Idea not found." };

  const originalText = idea.notes?.trim() || idea.title;
  const organized = await organizeIdea(originalText, new Date().toISOString().slice(0, 10));
  await updateIdea(idea.id, { last_reviewed_at: new Date().toISOString() });
  revalidatePath("/ideas");
  return { ok: true as const, data: organized };
}

export async function createIdeaTasksAction(rawInput: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const parsed = createTasksSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, error: "Choose at least one valid to-do." };

  const ideas = await listIdeas(user.id);
  const idea = ideas.find((candidate) => candidate.id === parsed.data.ideaId);
  if (!idea) return { ok: false as const, error: "Idea not found." };

  const domains = await listDomains(user.id);
  const domainIds = new Map(domains.map((domain) => [domain.slug, domain.id] as const));
  const createdIds: string[] = [];

  for (const suggestion of parsed.data.tasks) {
    const result = await taskService.create(user.id, {
      title: suggestion.title,
      notes: suggestion.notes ?? undefined,
      domainId: suggestion.domain ? domainIds.get(suggestion.domain) ?? null : null,
      estimatedMinutes: suggestion.estimatedMinutes ?? undefined,
      scheduledDate: suggestion.scheduledDate,
      dueDate: suggestion.dueDate,
      courageTask: suggestion.courageTask,
      source: "idea_dump",
    });

    if (!result.ok || !result.data || typeof result.data !== "object" || !("id" in result.data)) {
      return {
        ok: false as const,
        error: result.error ?? "One of the suggested to-dos could not be created.",
        data: { createdCount: createdIds.length },
      };
    }

    const taskId = String(result.data.id);
    createdIds.push(taskId);
    await insertTaskEvent({
      user_id: user.id,
      task_id: taskId,
      event_type: "idea_extracted",
      event_data: { idea_id: idea.id, idea_title: idea.title },
    });
  }

  await updateIdea(idea.id, {
    status: "active",
    last_reviewed_at: new Date().toISOString(),
  });
  revalidateIdeaSurfaces();
  return { ok: true as const, data: { createdCount: createdIds.length, taskIds: createdIds } };
}
