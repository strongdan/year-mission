"use client";

import { useEffect, useRef, useState } from "react";
import { coachAction, listProposalsAction, resolveProposalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Send } from "lucide-react";
import type { AiProposal } from "@/types/models";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = ["Plan my week", "What should I do now?", "Analyze my deferrals", "Break this task down"];

export function CoachView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<AiProposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadProposals() {
    const res = await listProposalsAction();
    if (res.ok && res.data) setProposals(res.data);
  }

  useEffect(() => {
    let cancelled = false;
    listProposalsAction().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) setProposals(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, proposals]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: message }]);

    try {
      const res = await coachAction(message, conversationId);
      if (!res.ok || !res.data) {
        setError(res.error ?? "Coach failed. Try again.");
        setMessages((m) => m.slice(0, -1));
      } else {
        setConversationId(res.data.conversationId);
        setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
        loadProposals();
      }
    } finally {
      setBusy(false);
    }
  }

  async function approve(proposalId: string) {
    const res = await resolveProposalAction(proposalId, "approve");
    if (!res.ok) setError(res.error ?? "Failed to apply.");
    setProposals((p) => p.filter((x) => x.id !== proposalId));
    loadProposals();
  }

  async function reject(proposalId: string) {
    await resolveProposalAction(proposalId, "reject");
    setProposals((p) => p.filter((x) => x.id !== proposalId));
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <header>
        <h1 className="text-xl font-semibold">Coach</h1>
        <p className="text-xs text-zinc-500">Grounds advice in your current state. Application code stays in charge.</p>
      </header>

      {proposals.length > 0 && (
        <div className="flex flex-col gap-2">
          {proposals.map((p) => (
            <Card key={p.id} className="border-sky-900/60">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-sky-300">{p.action_type.replace(/_/g, " ")}</p>
                  {p.reasoning && <p className="mt-1 text-sm text-zinc-300">{p.reasoning}</p>}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => approve(p.id)}>
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => reject(p.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {messages.length === 0 && (
        <Card>
          <p className="text-sm text-zinc-400">Ask the Coach about what to prioritize, why something keeps getting avoided, or how to break a task down.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <Button key={s} size="sm" variant="secondary" onClick={() => send(s)}>
                {s}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "self-end bg-zinc-100 text-zinc-950" : "self-start bg-zinc-900 text-zinc-200"}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="self-start rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-400">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md px-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the Coach…"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}