import { Router } from "express";
import { GenerateDraftInput } from "@fodx/shared";
import { generateDraft } from "../modules/outreach/service.js";
import { db } from "../database/db.js";

export const outreachRouter = Router();

outreachRouter.post("/generate", async (req, res, next) => {
  try {
    const input = GenerateDraftInput.parse(req.body);
    res.json(await generateDraft(input));
  } catch (err) { next(err); }
});

outreachRouter.get("/drafts", (_req, res) => {
  const rows = db.prepare(`
    SELECT d.*, b.name AS business_name FROM outreach_drafts d
    JOIN leads l ON l.id = d.lead_id JOIN businesses b ON b.id = l.business_id
    ORDER BY d.created_at DESC LIMIT 100
  `).all();
  res.json(rows);
});

outreachRouter.patch("/drafts/:id", (req, res, next) => {
  try {
    const { body, subject } = req.body as { body?: string; subject?: string | null };
    const fields: string[] = [];
    const params: unknown[] = [];
    if (typeof body === "string") { fields.push("body = ?"); params.push(body); }
    if (subject !== undefined) { fields.push("subject = ?"); params.push(subject); }
    if (fields.length === 0) return res.json({ ok: true });
    fields.push("updated_at = datetime('now')");
    params.push(req.params.id);
    db.prepare(`UPDATE outreach_drafts SET ${fields.join(", ")} WHERE id = ?`).run(...params);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

outreachRouter.post("/drafts/:id/approve", (req, res) => {
  db.prepare("UPDATE outreach_drafts SET approved = 1, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});