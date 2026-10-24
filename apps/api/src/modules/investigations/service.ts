import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import { createProviderFromEnv } from "../../agent/providers/openai.js";
import { createOllamaProvider } from "../../agent/providers/ollama.js";
import { runAgent, recordEvent, type RunnerCallbacks } from "../../agent/agent-runner.js";
import type { AIProvider } from "../../agent/providers/types.js";

const cancelled = new Set<string>();
const active = new Set<string>();

export interface StartInvestigationInput {
  title: string;
  task: string;
  city?: string;
  categories?: string[];
  resultLimit?: number;
}

export function startInvestigation(input: StartInvestigationInput): string {
  const id = nanoid();
  db.prepare(`
    INSERT INTO investigations (id, title, task, status, city, categories, result_limit)
    VALUES (?,?,?,?,?,?,?)
  `).run(
    id, input.title, input.task, "PENDING", input.city ?? null,
    input.categories ? JSON.stringify(input.categories) : null,
    input.resultLimit ?? null
  );
  // Fire and forget; SSE consumers read investigation_events
  void executeInvestigation(id, input.task);
  return id;
}

async function executeInvestigation(id: string, task: string) {
  active.add(id);
  const startedAt = new Date().toISOString();
  db.prepare("UPDATE investigations SET status = 'RUNNING', started_at = ? WHERE id = ?").run(startedAt, id);

  let seq = 0;
  const callbacks: RunnerCallbacks = {
    onEvent(ev) {
      seq++;
      recordEvent(id, seq, ev);
    },
    isCancelled: () => cancelled.has(id),
  };

  let provider: AIProvider | null = createProviderFromEnv();
  if (!provider) provider = createOllamaProvider();

  try {
    const { summary, error } = await runAgent({ investigationId: id, task, provider, callbacks });
    const status = cancelled.has(id) ? "CANCELLED" : error ? "FAILED" : "COMPLETED";
    db.prepare(
      "UPDATE investigations SET status = ?, summary = ?, error = ?, finished_at = datetime('now') WHERE id = ?"
    ).run(status, summary, error, id);
  } catch (err) {
    db.prepare(
      "UPDATE investigations SET status = 'FAILED', error = ?, finished_at = datetime('now') WHERE id = ?"
    ).run(String(err), id);
  } finally {
    active.delete(id);
    cancelled.delete(id);
  }
}

export function cancelInvestigation(id: string) {
  cancelled.add(id);
  db.prepare("UPDATE investigations SET status = 'CANCELLED', finished_at = datetime('now') WHERE id = ? AND status IN ('RUNNING','PENDING')").run(id);
}

export function listEvents(id: string, sinceSeq = 0) {
  const rows = db.prepare(
    "SELECT id, seq, kind, tool_name, status, payload, created_at FROM investigation_events WHERE investigation_id = ? AND seq > ? ORDER BY seq ASC"
  ).all(id, sinceSeq) as Array<{
    id: string; seq: number; kind: string; tool_name: string | null; status: string | null;
    payload: string | null; created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id, seq: r.seq, kind: r.kind, toolName: r.tool_name, status: r.status,
    payload: r.payload ? JSON.parse(r.payload) : null, createdAt: r.created_at,
  }));
}