import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { runMigrations } from "./database/migrate.js";
import { healthRouter } from "./routes/health.js";
import { discoveryRouter } from "./routes/discovery.js";
import { businessesRouter } from "./routes/businesses.js";
import { leadsRouter } from "./routes/leads.js";
import { investigationsRouter } from "./routes/investigations.js";
import { outreachRouter } from "./routes/outreach.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { reportsRouter } from "./routes/reports.js";
import { settingsRouter } from "./routes/settings.js";
import { logger } from "./logging/logger.js";
import { errorHandler } from "./routes/error-handler.js";

export function createApp() {
  runMigrations();
  const app = express();
  app.use(cors({
    origin: env.CORS_ORIGINS.split(",").map((s) => s.trim()),
  }));
  app.use(express.json({ limit: "256kb" }));
  app.use((req, _res, next) => {
    logger.info("http.request", { method: req.method, path: req.path });
    next();
  });

  app.use("/api/health", healthRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/discovery", discoveryRouter);
  app.use("/api/businesses", businessesRouter);
  app.use("/api/leads", leadsRouter);
  app.use("/api/investigations", investigationsRouter);
  app.use("/api/outreach", outreachRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);

  app.use(errorHandler);
  return app;
}