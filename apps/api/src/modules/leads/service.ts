import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import type { LeadStatus } from "@fodx/shared";

export function createLead(businessId: string): { id: string } {
  const id = nanoid();
  db.prepare("INSERT INTO leads (id, business_id) VALUES (?, ?)").run(id, businessId);
  return { id };
}

export function listLeads(opts: {
  status?: LeadStatus; city?: string; q?: string; sort?: string; page?: number; pageSize?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const conds: string[] = ["1=1"];
  const params: unknown[] = [];
  if (opts.status) { conds.push("l.status = ?"); params.push(opts.status); }
  if (opts.city) { conds.push("b.city = ?"); params.push(opts.city); }
  if (opts.q) { conds.push("(b.name LIKE ? OR b.phone LIKE ?)"); params.push(`%${opts.q}%`, `%${opts.q}%`); }
  const sortMap: Record<string, string> = {
    score: "b.opportunity_score DESC NULLS LAST",
    recent: "l.updated_at DESC",
    name: "b.name ASC",
  };
  const orderBy = sortMap[opts.sort ?? "recent"] ?? sortMap.recent;

  const rows = db.prepare(`
    SELECT l.id, l.business_id, l.status, l.notes, l.next_follow_up_at, l.created_at, l.updated_at,
           b.name, b.category, b.city, b.website_url, b.website_status, b.opportunity_score,
           (SELECT COUNT(*) FROM outreach_drafts d WHERE d.lead_id = l.id) AS draft_count
    FROM leads l JOIN businesses b ON b.id = l.business_id
    WHERE ${conds.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const totalRow = db.prepare(`
    SELECT COUNT(*) AS c FROM leads l JOIN businesses b ON b.id = l.business_id WHERE ${conds.join(" AND ")}
  `).get(...params) as { c: number };

  return { rows, total: totalRow.c, page, pageSize };
}

export function updateLead(id: string, patch: {
  status?: LeadStatus; notes?: string | null; nextFollowUpAt?: string | null;
}) {
  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.status !== undefined) { fields.push("status = ?"); params.push(patch.status); }
  if (patch.notes !== undefined) { fields.push("notes = ?"); params.push(patch.notes); }
  if (patch.nextFollowUpAt !== undefined) { fields.push("next_follow_up_at = ?"); params.push(patch.nextFollowUpAt); }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  params.push(id);
  db.prepare(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`).run(...params);
}