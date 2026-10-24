import { env } from "../../config/env.js";
import type { AIProvider, ProviderContext, ProviderResponse } from "./types.js";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  constructor(private opts: { baseUrl: string; apiKey: string; model: string }) {}
  isConfigured() { return !!this.opts.apiKey; }

  async chat(ctx: ProviderContext): Promise<ProviderResponse> {
    const body = {
      model: this.opts.model,
      messages: ctx.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCalls ? { tool_calls: m.toolCalls.map((t) => ({
          id: t.id, type: "function",
          function: { name: t.name, arguments: JSON.stringify(t.arguments) },
        })) } : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      })),
      tools: ctx.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      })),
      tool_choice: "auto",
    };
    const res = await fetch(`${this.opts.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`AI provider ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as {
      choices: Array<{ message: {
        content: string | null;
        tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
      } }>;
    };
    const msg = json.choices[0]?.message;
    return {
      content: msg?.content ?? null,
      toolCalls: (msg?.tool_calls ?? []).map((tc) => ({
        id: tc.id, name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || "{}"),
      })),
    };
  }
}

export function createProviderFromEnv() {
  if (env.AI_PROVIDER === "openai" && env.AI_API_KEY) {
    return new OpenAIProvider({ baseUrl: env.AI_BASE_URL, apiKey: env.AI_API_KEY, model: env.AI_MODEL });
  }
  return null;
}