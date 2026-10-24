import { Router } from "express";
import { db } from "../database/db.js";
import { env } from "../config/env.js";

export const healthRouter = Router();
healthRouter.get("/", (_req, res) => {
  const ok = !!db.prepare("SELECT 1 as v").get();
  res.json({
    ok,
    ai: {
      provider: env.AI_PROVIDER || null,
      configured: env.AI_PROVIDER === "openai" ? !!env.AI_API_KEY : env.AI_PROVIDER === "ollama",
    },
    now: new Date().toISOString(),
  });
});