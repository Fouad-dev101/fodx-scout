import { Router } from "express";
import { db } from "../database/db.js";

export const reportsRouter = Router();

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Spreadsheet formula injection defense
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

reportsRouter.get("/leads.csv", (_req, res) => {
  const rows = db.prepare(`
    SELECT b.name, b.category, b.city, b.country, b.website_url, b.website_status,
           b.opportunity_score, b.score_breakdown, b.phone, b.email, b.source, b.source_url,
           l.status, l.notes
    FROM leads l JOIN businesses b ON b.id = l.business_id
    ORDER BY b.opportunity_score DESC NULLS LAST
  `).all() as Array<Record<string, unknown>>;

  const headers = [
    "name","category","city","country","website_url","website_status","opportunity_score",
    "score_summary","phone","email","source","source_url","lead_status","notes",
  ];

  const lines = [headers.join(",")];
  for (const r of rows) {
    let scoreSummary = "";
    if (r.score_breakdown) {
      try {
        const bd = JSON.parse(String(r.score_breakdown)) as { components: Array<{ label: string; reason: string }> };
        scoreSummary = bd.components.map((c) => `${c.label}: ${c.reason}`).join(" | ");
      } catch { /* ignore */ }
    }
    lines.push([
      r.name, r.category, r.city, r.country, r.website_url, r.website_status,
      r.opportunity_score, scoreSummary, r.phone, r.email, r.source, r.source_url,
      r.status, r.notes,
    ].map(csvEscape).join(","));
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"fodx-leads.csv\"");
  res.send(lines.join("\r\n"));
});