import { Router } from "express";
import { db } from "../database/db.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", (_req, res) => {
  const c = (sql: string): number => (db.prepare(sql).get() as { c: number }).c;

  const totalBusinesses = c("SELECT COUNT(*) AS c FROM businesses");
  const verifiedWebsites = c("SELECT COUNT(*) AS c FROM businesses WHERE website_status = 'VERIFIED_ACCESSIBLE'");
  const noWebsite = c("SELECT COUNT(*) AS c FROM businesses WHERE website_status = 'NO_WEBSITE_DISCOVERED'");
  const highPriority = c("SELECT COUNT(*) AS c FROM businesses WHERE opportunity_score >= 60");
  const investigationsCompleted = c("SELECT COUNT(*) AS c FROM investigations WHERE status = 'COMPLETED'");
  const draftsCreated = c("SELECT COUNT(*) AS c FROM outreach_drafts");
  const leadsAwaitingFollowUp = c("SELECT COUNT(*) AS c FROM leads WHERE next_follow_up_at IS NOT NULL AND next_follow_up_at <= datetime('now')");
  const leadsContacted = c("SELECT COUNT(*) AS c FROM leads WHERE status IN ('CONTACTED','REPLIED','MEETING')");
  const leadsWon = c("SELECT COUNT(*) AS c FROM leads WHERE status = 'WON'");

  const pipeline = db.prepare("SELECT status, COUNT(*) AS c FROM leads GROUP BY status").all();

  const recentInvestigations = db.prepare(
    "SELECT id, title, status, created_at, finished_at FROM investigations ORDER BY created_at DESC LIMIT 5"
  ).all();

  const highPriorityProspects = db.prepare(`
    SELECT b.id, b.name, b.city, b.website_status, b.opportunity_score
    FROM businesses b WHERE b.opportunity_score IS NOT NULL
    ORDER BY b.opportunity_score DESC LIMIT 5
  `).all();

  res.json({
    metrics: {
      totalBusinesses, verifiedWebsites, noWebsite, highPriority,
      investigationsCompleted, draftsCreated, leadsAwaitingFollowUp,
      leadsContacted, leadsWon,
    },
    pipeline,
    recentInvestigations,
    highPriorityProspects,
    emptiness: totalBusinesses === 0,
  });
});