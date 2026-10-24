import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_PATH: z.string().default("./data/fodx.db"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  AI_PROVIDER: z.enum(["", "openai", "ollama"]).default(""),
  AI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  OVERPASS_URL: z.string().default("https://overpass-api.de/api/interpreter"),
  OVERPASS_TIMEOUT_MS: z.coerce.number().default(25000),
  OVERPASS_MAX_RESULTS: z.coerce.number().default(200),
  WEB_FETCH_TIMEOUT_MS: z.coerce.number().default(10000),
  WEB_FETCH_MAX_BYTES: z.coerce.number().default(524288),
  WEB_FETCH_MAX_REDIRECTS: z.coerce.number().default(3),
  WEB_FETCH_CONCURRENCY: z.coerce.number().default(3),
  AGENT_MAX_TOOL_CALLS: z.coerce.number().default(25),
  AGENT_MAX_DURATION_MS: z.coerce.number().default(120000),
  AGENT_MAX_BUSINESSES_PER_INVESTIGATION: z.coerce.number().default(15),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;