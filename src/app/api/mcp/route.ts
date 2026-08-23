import { NextResponse } from "next/server";
import { authenticateExternalOwner } from "@/lib/external-owner-auth";
import {
  createYearMissionExternalProposal,
  getYearMissionExternalContext,
} from "@/services/external-integration-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tools = [
  {
    name: "get_year_mission_context",
    description: "Read the owner's current Year Mission goals, tasks, week mode, HealthKit summary, and adaptive wellness recommendation.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "create_year_mission_proposal",
    description: "Record a proposed adjustment for owner review. This never applies the change directly.",
    inputSchema: {
      type: "object",
      properties: {
        actionType: { type: "string", enum: ["health_adjustment", "progress_note", "task_adjustment"] },
        payload: { type: "object", additionalProperties: true },
        reasoning: { type: "string" },
      },
      required: ["actionType", "payload", "reasoning"],
      additionalProperties: false,
    },
  },
];

function rpc(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: unknown, code: number, message: string, status = 400) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const auth = await authenticateExternalOwner(request, "chatgpt");
  if (!auth.ok) return rpcError(null, -32001, auth.message, auth.status);

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: { name?: string; arguments?: unknown } };
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  if (body.jsonrpc !== "2.0" || !body.method) return rpcError(body.id ?? null, -32600, "Invalid Request");

  if (body.method === "tools/list") {
    return rpc(body.id ?? null, { tools });
  }

  if (body.method === "tools/call") {
    const name = body.params?.name;
    try {
      if (name === "get_year_mission_context") {
        const data = await getYearMissionExternalContext(auth.admin, auth.userId);
        return rpc(body.id ?? null, {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        });
      }
      if (name === "create_year_mission_proposal") {
        const data = await createYearMissionExternalProposal(
          auth.admin,
          auth.userId,
          body.params?.arguments ?? {}
        );
        return rpc(body.id ?? null, {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        });
      }
      return rpcError(body.id ?? null, -32602, `Unknown tool: ${name ?? ""}`);
    } catch (error) {
      console.error("MCP tool failed", error);
      return rpc(body.id ?? null, {
        content: [{ type: "text", text: "Year Mission tool failed." }],
        isError: true,
      });
    }
  }

  return rpcError(body.id ?? null, -32601, "Method not found");
}
