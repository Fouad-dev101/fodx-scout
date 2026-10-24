import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import { safeFetch } from "../../security/safe-fetch.js";
import type { WebsiteInspection } from "@fodx/shared";

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? (m[1] ?? "").trim() || null : null;
}

export async function inspectBusinessWebsite(businessId: string): Promise<WebsiteInspection> {
  const row = db.prepare("SELECT website_url, website_status FROM businesses WHERE id = ?").get(businessId) as
    { website_url: string | null; website_status: string } | undefined;
  if (!row) throw new Error("Business not found");
  if (!row.website_url) throw new Error("Business has no website URL");
  if (row.website_status !== "VERIFIED_ACCESSIBLE") {
    throw new Error(`Cannot inspect: website status is ${row.website_status}`);
  }

  const result = await safeFetch(row.website_url, { method: "GET", readBody: true });
  if (!result.ok || !result.body) {
    throw new Error(result.error ?? "Could not retrieve website");
  }
  const html = result.body;

  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    ?? extract(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical = extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const lang = extract(html, /<html[^>]+lang=["']([^"']+)["']/i);
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => m[1]?.replace(/<[^>]+>/g, "").trim() ?? "")
    .filter(Boolean).slice(0, 5);

  const imgMatches = [...html.matchAll(/<img\b[^>]*>/gi)];
  const imageCount = imgMatches.length;
  const imagesMissingAlt = imgMatches.filter((m) => !/\balt=/.test(m[0])).length;

  const hasNav = /<nav\b/i.test(html);
  const hasContactLink = /href=["'][^"']*contact/i.test(html);
  const hasTelLink = /href=["']tel:/i.test(html);
  const hasMailtoLink = /href=["']mailto:/i.test(html);
  const hasAddressHint = /address|adresse|العنوان/i.test(html);
  const hasReservationHint = /réservation|reservation|booking|réserver|book now/i.test(html);

  const findings: string[] = [];
  const inconclusive: string[] = [];
  if (!title) findings.push("No <title> element found.");
  if (!metaDescription) findings.push("No non-empty meta description found.");
  if (!lang) findings.push("No lang attribute on <html>.");
  if (!hasViewport) findings.push("No viewport meta tag found (HTML-level check only — not a responsiveness test).");
  if (h1s.length === 0) findings.push("No <h1> heading found.");
  if (imagesMissingAlt > 0) findings.push(`${imagesMissingAlt} image(s) missing alt attribute.`);
  if (!hasTelLink && !hasMailtoLink && !hasContactLink) findings.push("No obvious contact link, tel: or mailto: link detected.");
  inconclusive.push("Mobile responsiveness cannot be determined from HTML alone.");
  inconclusive.push("Overall accessibility and performance cannot be determined without browser-based testing.");

  const inspection: WebsiteInspection = {
    finalUrl: result.finalUrl ?? row.website_url,
    https: (result.finalUrl ?? row.website_url).startsWith("https:"),
    httpStatus: result.status ?? 0,
    responseTimeMs: result.responseTimeMs,
    title, metaDescription, canonical, lang,
    hasViewport, h1: h1s,
    imageCount, imagesMissingAlt,
    hasNav, hasContactLink, hasTelLink, hasMailtoLink,
    hasAddressHint, hasReservationHint,
    findings, inconclusive,
    inspectedAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO website_inspections (id, business_id, final_url, report, inspected_at)
    VALUES (?,?,?,?,?)
  `).run(nanoid(), businessId, inspection.finalUrl, JSON.stringify(inspection), inspection.inspectedAt);

  return inspection;
}