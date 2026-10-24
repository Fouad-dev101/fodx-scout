import { Router } from "express";
import { env } from "../config/env.js";

export const settingsRouter = Router();

settingsRouter.get("/", (_req, res) => {
  res.json({
    ai: {
      provider: env.AI_PROVIDER || null,
      model: env.AI_MODEL,
      baseUrl: env.AI_BASE_URL,
      apiKeyConfigured: !!env.AI_API_KEY,
    },
    discovery: {
      overpassUrl: env.OVERPASS_URL,
      overpassTimeoutMs: env.OVERPASS_TIMEOUT_MS,
      overpassMaxResults: env.OVERPASS_MAX_RESULTS,
    },
    webFetch: {
      timeoutMs: env.WEB_FETCH_TIMEOUT_MS,
      maxBytes: env.WEB_FETCH_MAX_BYTES,
      maxRedirects: env.WEB_FETCH_MAX_REDIRECTS,
      concurrency: env.WEB_FETCH_CONCURRENCY,
    },
    agent: {
      maxToolCalls: env.AGENT_MAX_TOOL_CALLS,
      maxDurationMs: env.AGENT_MAX_DURATION_MS,
      maxBusinesses: env.AGENT_MAX_BUSINESSES_PER_INVESTIGATION,
    },
    note: "These values are read from environment variables and cannot be changed at runtime. Edit .env to change them.",
  });
});