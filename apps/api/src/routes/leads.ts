import { Router } from "express";
import { LeadStatusEnum } from "@fodx/shared";
import { createLead, listLeads, updateLead } from "../modules/leads/service.js";
import { db } from "../database/db.js";

export const leadsRouter = Router();

leadsRouter.get("/", (req, res, next) => {
  try {
    const status = req.query.status ? LeadStatusEnum.parse(req.query.status) : undefined;
    res.json(listLeads({
      status, city: req.query.city as string | undefined, q: req.query.q as string | undefined,
      sort: req.query.sort as string | undefined,
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 25,
    }));
  } catch (err) { next(err); }
});

leadsRouter.post("/", (req, res, next) => {
  try {
    const { businessId } = req.body as { businessId: string };
    if (!businessId) throw new Error("businessId required");
    // ensure business exists
    const b = db.prepare("SELECT id FROM businesses WHERE id = ?").get(businessId);
    if (!b) return res.status(404).json({ error: "Business not found" });
    res.json(createLead(businessId));
  } catch (err) { next(err); }
});

leadsRouter.get("/:id", (req, res) => {
  const lead = db.prepare(`
    SELECT l.*, b.name, b.category, b.city, b.website_url, b.website_status, b.opportunity_score, b.score_breakdown, b.phone, b.email, b.address, b.source_url
    FROM leads l JOIN businesses b ON b.id = l.business_id WHERE l.id = ?
  `).get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Not found" });
  const drafts = db.prepare("SELECT * FROM outreach_drafts WHERE lead_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ lead, drafts });
});

leadsRouter.patch("/:id", (req, res, next) => {
  try {
    const status = req.body.status ? LeadStatusEnum.parse(req.body.status) : undefined;
    updateLead(req.params.id, {
      status,
      notes: typeof req.body.notes === "string" || req.body.notes === null ? req.body.notes : undefined,
      nextFollowUpAt: typeof req.body.nextFollowUpAt === "string" || req.body.nextFollowUpAt === null ? req.body.nextFollowUpAt : undefined,
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

leadsRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});