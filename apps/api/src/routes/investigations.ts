import { Router } from "express";
import { db } from "../database/db.js";
import { startInvestigation, cancelInvestigation, listEvents } from "../modules/investigations/service.js";

export const investigationsRouter = Router();

investigationsRouter.post("/", (req, res, next) => {
  try {
    const { title, task, city, categories, resultLimit } = req.body as {
      title: string; task: string; city?: string; categories?: string[]; resultLimit?: number;
    };
    if (!title || !task) throw new Error("title and task required");
    const id = startInvestigation({ title, task, city, categories, resultLimit });
    res.json({ id });
  } catch (err) { next(err); }
});

investigationsRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM investigations ORDER BY created_at DESC LIMIT 100").all();
  res.json(rows);
});

investigationsRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM investigations WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

investigationsRouter.post("/:id/cancel", (req, res) => {
  cancelInvestigation(req.params.id);
  res.json({ ok: true });
});

investigationsRouter.get("/:id/events", (req, res) => {
  const since = Number(req.query.since ?? 0);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const send = () => {
    const events = listEvents(req.params.id, since);
    for (const ev of events) {
      res.write(`event: update\ndata: ${JSON.stringify(ev)}\n\n`);
    }
  };
  send();
  const timer = setInterval(send, 2000);
  req.on("close", () => clearInterval(timer));
});