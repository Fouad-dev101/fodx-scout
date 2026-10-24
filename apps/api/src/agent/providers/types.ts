export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ProviderMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ProviderResponse {
  content: string | null;
  toolCalls: ToolCall[];
}

export interface ProviderContext {
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  messages: ProviderMessage[];
}

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  chat(ctx: ProviderContext): Promise<ProviderResponse>;
}