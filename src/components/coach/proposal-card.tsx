"use client";

import { Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AiProposal } from "@/types/models";

interface ProposalCardProps {
  proposal: AiProposal;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  create_task: "Create task",
  reschedule_task: "Reschedule task",
  change_task_status: "Change task status",
  update_task: "Update task",
  decompose_task: "Decompose task",
  set_weekly_win: "Set weekly win",
  promote_to_week: "Promote to This Week",
  promote_to_today: "Promote to Today",
  set_week_mode: "Set week mode",
  update_weekly_review: "Update weekly review",
  activate_experiment: "Activate experiment",
  conclude_experiment: "Conclude experiment",
};

const HIGH_RISK_ACTIONS = new Set([
  "change_task_status",
  "decompose_task",
  "set_weekly_win",
  "set_week_mode",
  "activate_experiment",
  "conclude_experiment",
  "update_weekly_review",
]);

function payloadLines(proposal: AiProposal): string[] {
  const payload = proposal.payload as Record<string, unknown>;
  if (!payload || typeof payload !== "object") return [];

  const lines: string[] = [];
  if (proposal.action_type === "create_task") {
    const p = payload as { payload?: { title?: string; domain?: string; scheduled_date?: string; estimated_minutes?: number; courage_task?: boolean } };
    if (p.payload?.title) lines.push(`Title: ${p.payload.title}`);
    if (p.payload?.domain) lines.push(`Domain: ${p.payload.domain}`);
    if (p.payload?.scheduled_date) lines.push(`Scheduled: ${p.payload.scheduled_date}`);
    if (p.payload?.estimated_minutes) lines.push(`Est. ${p.payload.estimated_minutes} min`);
    if (p.payload?.courage_task) lines.push("Courage task");
    return lines;
  }
  if (proposal.action_type === "set_week_mode") {
    const p = payload as { mode?: string };
    if (p.mode) lines.push(`Mode: ${p.mode.replace(/_/g, " ")}`);
    return lines;
  }
  if (proposal.action_type === "change_task_status") {
    const p = payload as { to_status?: string };
    if (p.to_status) lines.push(`New status: ${p.to_status.replace(/_/g, " ")}`);
    return lines;
  }
  if (proposal.action_type === "decompose_task") {
    const p = payload as { sub_tasks?: { title?: string }[] };
    if (Array.isArray(p.sub_tasks)) {
      lines.push(`${p.sub_tasks.length} sub-tasks:`);
      p.sub_tasks.slice(0, 4).forEach((s) => s.title && lines.push(`• ${s.title}`));
    }
    return lines;
  }
  if (proposal.action_type === "conclude_experiment") {
    const p = payload as { decision?: string };
    if (p.decision) lines.push(`Decision: ${p.decision}`);
    return lines;
  }
  if (proposal.action_type === "update_weekly_review") {
    const p = payload as { payload?: { next_week_focus?: string } };
    if (p.payload?.next_week_focus) lines.push(`Focus: ${p.payload.next_week_focus}`);
    return lines;
  }
  return [];
}

export function ProposalCard({ proposal, onApprove, onReject, busy }: ProposalCardProps) {
  const highRisk = HIGH_RISK_ACTIONS.has(proposal.action_type);
  const details = payloadLines(proposal);

  return (
    <Card className={highRisk ? "border-amber-900/60" : "border-sky-900/60"}>
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-sky-300">{ACTION_LABELS[proposal.action_type] ?? proposal.action_type.replace(/_/g, " ")}</p>
            {highRisk && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                <ShieldAlert className="h-3 w-3" />
                Requires review
              </span>
            )}
          </div>
          {proposal.reasoning && <p className="mt-1 text-sm text-zinc-300">{proposal.reasoning}</p>}
          {details.length > 0 && (
            <div className="mt-2 rounded-xl bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400">
              {details.map((line, i) => (
                <p key={i} className="truncate">
                  {line}
                </p>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onApprove(proposal.id)} disabled={busy}>
              {highRisk ? "Review & apply" : "Apply"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onReject(proposal.id)} disabled={busy}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}