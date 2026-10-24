import type { AIProvider, ProviderContext, ProviderResponse } from "./types.js";
import { env } from "../../config/env.js";

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  constructor(private opts: { baseUrl: string; model: string }) {}
  isConfigured() { return true; }

  async chat(ctx: ProviderContext): Promise<ProviderResponse> {
    const body = {
      model: this.opts.model,
      stream: false,
      messages: ctx.messages.map((m) => ({
        role: m.role === "tool" ? "tool" : m.role,
        content: m.content ?? "",
      })),
      tools: ctx.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      })),
    };
    const res = await fetch(`${this.opts.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as {
      message: {
        content?: string;
        tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> | string } }>;
      };
    };
    return {
      content: json.message.content ?? null,
      toolCalls: (json.message.tool_calls ?? []).map((tc, i) => ({
        id: `ollama-${i}-${Date.now()}`,
        name: tc.function.name,
        arguments: typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments || "{}")
          : tc.function.arguments,
      })),
    };
  }
}

export function createOllamaProvider() {
  if (env.AI_PROVIDER === "ollama") {
    return new OllamaProvider({ baseUrl: env.AI_BASE_URL, model: env.AI_MODEL });
  }
  return null;
}