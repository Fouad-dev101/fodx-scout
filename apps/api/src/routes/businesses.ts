import { Router } from "express";
import { db } from "../database/db.js";
import { verifyBusinessWebsite } from "../modules/website-analysis/verify.js";
import { inspectBusinessWebsite } from "../modules/website-analysis/inspect.js";
import { calculateOpportunityScore } from "../modules/scoring/score.js";
import { listEvidenceForBusiness } from "../modules/evidence/service.js";

export const businessesRouter = Router();

businessesRouter.get("/", (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(200, Number(req.query.pageSize) || 25);
  const offset = (page - 1) * pageSize;
  const rows = db.prepare(`
    SELECT id, name, category, city, country, phone, email, website_url, website_status, opportunity_score, source, created_at
    FROM businesses ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  const total = (db.prepare("SELECT COUNT(*) AS c FROM businesses").get() as { c: number }).c;
  res.json({ rows, total, page, pageSize });
});

businessesRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM businesses WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

businessesRouter.post("/:id/verify-website", async (req, res, next) => {
  try { res.json(await verifyBusinessWebsite(req.params.id)); } catch (err) { next(err); }
});

businessesRouter.post("/:id/inspect-website", async (req, res, next) => {
  try { res.json(await inspectBusinessWebsite(req.params.id)); } catch (err) { next(err); }
});

businessesRouter.post("/:id/score", (req, res, next) => {
  try { res.json(calculateOpportunityScore(req.params.id)); } catch (err) { next(err); }
});

businessesRouter.get("/:id/evidence", (req, res, next) => {
  try { res.json(listEvidenceForBusiness(req.params.id)); } catch (err) { next(err); }
});