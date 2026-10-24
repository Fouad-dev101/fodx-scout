import { nanoid } from "nanoid";
import { db } from "../database/db.js";
import { env } from "../config/env.js";
import { logger } from "../logging/logger.js";
import { toolRegistry } from "./tool-registry.js";
import type { AIProvider, ProviderMessage } from "./providers/types.js";

export interface RunnerCallbacks {
  onEvent: (event: {
    kind: "STATUS" | "TOOL_CALL" | "TOOL_RESULT" | "MESSAGE" | "ERROR";
    toolName?: string;
    status?: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
    payload: unknown;
  }) => void;
  isCancelled: () => boolean;
}

export async function runAgent(opts: {
  investigationId: string;
  task: string;
  provider: AIProvider | null;
  callbacks: RunnerCallbacks;
}): Promise<{ summary: string; error: string | null }> {
  const { investigationId, task, provider, callbacks } = opts;
  
  if (!provider || !provider.isConfigured()) {
    callbacks.onEvent({
      kind: "ERROR", payload: {
        message: "AI provider is not configured. Set AI_PROVIDER, AI_API_KEY (for openai), and AI_MODEL in .env, or switch to Ollama. Non-AI features (discovery, verification, scoring, leads, exports) still work.",
      },
    });
    return { summary: "", error: "AI provider not configured" };
  }

  const toolDefs = Object.values(toolRegistry).map((t) => ({
    name: t.name, description: t.description, parameters: t.parameters,
  }));

  const systemPrompt = `You are FODX Scout's research agent for a web-developer who finds small businesses that could benefit from a website or improvements to their online presence.

Strict rules:
- Never invent businesses, phone numbers, emails, websites, reviews, or evidence.
- Use tools to obtain real data. Only cite facts returned by tools.
- If a tool fails, say so honestly. Do not pretend it succeeded.
- Do not send messages; you can only gather evidence and compute scores.
- Keep final summaries factual and short.
- Available tools: ${toolDefs.map((t) => t.name).join(", ")}.`;

  const messages: ProviderMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  const start = Date.now();
  let toolCalls = 0;
  let finalContent: string | null = null;

  while (toolCalls < env.AGENT_MAX_TOOL_CALLS && Date.now() - start < env.AGENT_MAX_DURATION_MS) {
    if (callbacks.isCancelled()) {
      callbacks.onEvent({ kind: "STATUS", payload: { message: "Cancelled" } });
      return { summary: "", error: "Cancelled" };
    }

    let response;
    let retries = 3;
    
    // --- Retry loop for Groq 429 Rate Limits ---
    for (let i = 0; i < retries; i++) {
      try {
        response = await provider.chat({ tools: toolDefs, messages });
        break; // Success, exit retry loop
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        
        // If we hit a rate limit (429), wait 6 seconds and retry automatically
        if (msg.includes("429") && i < retries - 1) {
          callbacks.onEvent({ kind: "STATUS", payload: { message: "Hit Groq rate limit. Waiting 6 seconds to retry..." } });
          await new Promise((resolve) => setTimeout(resolve, 6000));
          continue; // Try again
        }
        
        // If it's a different error (like 401 Unauthorized) or we ran out of retries, fail
        callbacks.onEvent({ kind: "ERROR", payload: { message: msg } });
        return { summary: "", error: msg };
      }
    }

    if (!response) break; 

    if (response.toolCalls.length === 0) {
      finalContent = response.content ?? "";
      callbacks.onEvent({ kind: "MESSAGE", payload: { content: finalContent } });
      break;
    }

    messages.push({ role: "assistant", content: response.content, toolCalls: response.toolCalls });

    for (const tc of response.toolCalls) {
      if (toolCalls >= env.AGENT_MAX_TOOL_CALLS) break;
      toolCalls++;
      
      const def = toolRegistry[tc.name];
      callbacks.onEvent({ kind: "TOOL_CALL", toolName: tc.name, status: "RUNNING", payload: { arguments: tc.arguments } });
      
      if (!def) {
        callbacks.onEvent({ kind: "TOOL_RESULT", toolName: tc.name, status: "FAILED", payload: { error: "Unknown tool" } });
        messages.push({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ error: "Unknown tool" }) });
        continue;
      }
      
      try {
        const parsed = def.schema.parse(tc.arguments);
        const result = await def.execute(parsed);
        
        // Show full (truncated to 2k for UI) result in the timeline
        callbacks.onEvent({ kind: "TOOL_RESULT", toolName: tc.name, status: "SUCCEEDED", payload: summarizeForEvent(result) });
        
        // --- Truncate tool results to 2000 chars to save tokens before sending back to AI ---
        const resultString = JSON.stringify(result);
        const truncatedResult = resultString.length > 2000 ? resultString.slice(0, 2000) + '...[TRUNCATED]' : resultString;
        
        messages.push({ role: "tool", toolCallId: tc.id, content: truncatedResult });
        
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn("tool.failed", { tool: tc.name, error: msg });
        callbacks.onEvent({ kind: "TOOL_RESULT", toolName: tc.name, status: "FAILED", payload: { error: msg } });
        messages.push({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ error: msg }) });
      }
    }
  }

  return { summary: finalContent ?? "", error: null };
}

function summarizeForEvent(result: unknown): unknown {
  const s = JSON.stringify(result);
  if (s.length <= 2000) return result;
  return { truncated: true, preview: s.slice(0, 2000) };
}

export function recordEvent(investigationId: string, seq: number, ev: Parameters<RunnerCallbacks["onEvent"]>[0]) {
  db.prepare(`
    INSERT INTO investigation_events (id, investigation_id, seq, kind, tool_name, status, payload)
    VALUES (?,?,?,?,?,?,?)
  `).run(
    nanoid(), investigationId, seq, ev.kind,
    ev.toolName ?? null, ev.status ?? null,
    JSON.stringify(ev.payload ?? null)
  );
}