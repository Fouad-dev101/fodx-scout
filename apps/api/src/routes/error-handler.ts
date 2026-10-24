import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../logging/logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid input", issues: err.issues });
  }
  const msg = err instanceof Error ? err.message : "Internal error";
  logger.error("route.error", { message: msg });
  res.status(400).json({ error: msg });
}