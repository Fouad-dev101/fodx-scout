import { db } from "../../database/db.js";
import type { ScoreBreakdown } from "@fodx/shared";

interface BusinessForScore {
  id: string;
  website_url: string | null;
  website_status: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  city: string | null;
}

const WEIGHTS = {
  noWebsite: 40,
  inaccessibleWebsite: 15,
  providedButUnverified: 20,
  metadataIssues: 20,
  hasContactChannel: 10,
  hasAddress: 5,
  unknownCategory: -5,
} as const;

export function calculateOpportunityScore(businessId: string): ScoreBreakdown {
  const business = db.prepare(
    "SELECT id, website_url, website_status, phone, email, address, category, city FROM businesses WHERE id = ?"
  ).get(businessId) as BusinessForScore | undefined;
  if (!business) throw new Error("Business not found");

  const components: ScoreBreakdown["components"] = [];
  const warnings: string[] = [];
  let total = 0;

  if (business.website_status === "NO_WEBSITE_DISCOVERED") {
    const c = WEIGHTS.noWebsite;
    total += c;
    components.push({
      key: "noWebsite", label: "No website discovered in source", weight: WEIGHTS.noWebsite,
      rawValue: 1, contribution: c,
      reason: "The source record did not include a website URL. Note: this is not proof the business has no website — only that none was found in this source.",
    });
    warnings.push("No website was discovered, but absence is not confirmed.");
  } else if (business.website_status === "VERIFICATION_FAILED") {
    const c = WEIGHTS.inaccessibleWebsite;
    total += c;
    components.push({
      key: "inaccessibleWebsite", label: "Website failed verification",
      weight: WEIGHTS.inaccessibleWebsite, rawValue: 1, contribution: c,
      reason: "Automated verification could not reach the provided website URL.",
    });
    warnings.push("Website may still be accessible from a normal browser. Manual review recommended.");
  } else if (business.website_status === "PROVIDED_BUT_UNVERIFIED") {
    const c = WEIGHTS.providedButUnverified;
    total += c;
    components.push({
      key: "providedButUnverified", label: "Website provided but not yet verified",
      weight: WEIGHTS.providedButUnverified, rawValue: 1, contribution: c,
      reason: "A website URL was provided by the source but has not been verified.",
    });
  } else if (business.website_status === "VERIFIED_ACCESSIBLE") {
    // Check latest inspection
    const latest = db.prepare(
      "SELECT report FROM website_inspections WHERE business_id = ? ORDER BY inspected_at DESC LIMIT 1"
    ).get(businessId) as { report: string } | undefined;
    if (latest) {
      const report = JSON.parse(latest.report) as {
        findings: string[]; hasViewport: boolean; metaDescription: string | null;
        imagesMissingAlt: number; hasTelLink: boolean; hasMailtoLink: boolean;
      };
      let issueCount = 0;
      if (report.findings.length > 0) issueCount += Math.min(3, report.findings.length);
      if (!report.hasViewport) issueCount += 1;
      if (!report.metaDescription) issueCount += 1;
      if (report.imagesMissingAlt > 0) issueCount += 1;
      if (!report.hasTelLink && !report.hasMailtoLink) issueCount += 1;
      const raw = Math.min(1, issueCount / 6);
      const c = Math.round(WEIGHTS.metadataIssues * raw);
      total += c;
      components.push({
        key: "metadataIssues", label: "Website quality signal strength",
        weight: WEIGHTS.metadataIssues, rawValue: raw, contribution: c,
        reason: `Lightweight HTML inspection found ${issueCount} issue signal(s). Not a comprehensive audit.`,
      });
    } else {
      warnings.push("Website is accessible but has not been inspected; quality signal not computed.");
    }
  }

  const hasContact = !!(business.phone || business.email);
  if (hasContact) {
    total += WEIGHTS.hasContactChannel;
    components.push({
      key: "hasContactChannel", label: "Public contact channel present",
      weight: WEIGHTS.hasContactChannel, rawValue: 1, contribution: WEIGHTS.hasContactChannel,
      reason: "A phone or email is listed in the source record.",
    });
  } else {
    warnings.push("No public contact channel was found in the source record.");
  }

  if (business.address) {
    total += WEIGHTS.hasAddress;
    components.push({
      key: "hasAddress", label: "Address available",
      weight: WEIGHTS.hasAddress, rawValue: 1, contribution: WEIGHTS.hasAddress,
      reason: "The source record contains a street address.",
    });
  }

  if (!business.category) {
    total += WEIGHTS.unknownCategory;
    components.push({
      key: "unknownCategory", label: "Category unknown",
      weight: WEIGHTS.unknownCategory, rawValue: 1, contribution: WEIGHTS.unknownCategory,
      reason: "Category could not be determined from the source record; scoring is less reliable.",
    });
  }

  total = Math.max(0, Math.min(100, Math.round(total)));
  const breakdown: ScoreBreakdown = {
    total, components, warnings,
    computedAt: new Date().toISOString(),
  };

  db.prepare(
    "UPDATE businesses SET opportunity_score = ?, score_breakdown = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(total, JSON.stringify(breakdown), businessId);

  return breakdown;
}