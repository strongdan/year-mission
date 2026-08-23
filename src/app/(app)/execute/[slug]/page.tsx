import { notFound } from "next/navigation";
import { EveningRoutineRunner } from "@/components/execution/evening-routine-runner";
import { FocusRunner } from "@/components/execution/focus-runner";
import { HypnosisPlayer } from "@/components/execution/hypnosis-player";
import { MeditationRunner } from "@/components/execution/meditation-runner";
import { MobilityRunner } from "@/components/execution/mobility-runner";
import { WorkoutRunner } from "@/components/execution/workout-runner";
import { MOBILITY_PROTOCOLS, WORKOUT_PROTOCOLS } from "@/domain/execution-protocols";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ taskId?: string; minutes?: string }>;
}

export default async function ExecutionProtocolPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const taskId = query.taskId ?? null;

  if (WORKOUT_PROTOCOLS[slug]) return <WorkoutRunner slug={slug} taskId={taskId} />;
  if (MOBILITY_PROTOCOLS[slug]) return <MobilityRunner slug={slug} taskId={taskId} />;
  if (slug === "focus") {
    if (!taskId) notFound();
    const parsed = Number(query.minutes ?? "5");
    const minutes = Number.isFinite(parsed) ? Math.max(1, Math.min(60, parsed)) : 5;
    return <FocusRunner taskId={taskId} initialMinutes={minutes} />;
  }
  if (slug === "meditation") {
    const parsed = Number(query.minutes ?? "5");
    const minutes = [5, 10, 20].includes(parsed) ? parsed : 5;
    return <MeditationRunner initialMinutes={minutes} taskId={taskId} />;
  }
  if (slug === "hypnosis") return <HypnosisPlayer taskId={taskId} />;
  if (slug === "evening-reset") return <EveningRoutineRunner taskId={taskId} />;
  notFound();
}
