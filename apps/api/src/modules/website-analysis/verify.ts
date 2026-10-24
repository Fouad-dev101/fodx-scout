import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import { safeFetch } from "../../security/safe-fetch.js";
import type { WebsiteVerification } from "@fodx/shared";

export async function verifyBusinessWebsite(businessId: string): Promise<WebsiteVerification> {
  const row = db.prepare("SELECT website_url FROM businesses WHERE id = ?").get(businessId) as
    { website_url: string | null } | undefined;
  if (!row) throw new Error("Business not found");

  let verification: WebsiteVerification;
  if (!row.website_url) {
    verification = {
      status: "NO_WEBSITE_DISCOVERED",
      httpStatus: null, finalUrl: null, responseTimeMs: null,
      https: null, error: null,
      checkedAt: new Date().toISOString(),
    };
  } else {
    const result = await safeFetch(row.website_url, { method: "GET", readBody: false });
    let status: WebsiteVerification["status"];
    if (result.error?.startsWith("Blocked:")) {
      status = "NEEDS_MANUAL_REVIEW";
    } else if (!result.status) {
      status = "VERIFICATION_FAILED";
    } else if (result.status < 500) {
      status = "VERIFIED_ACCESSIBLE";
    } else {
      status = "VERIFICATION_FAILED";
    }
    verification = {
      status,
      httpStatus: result.status,
      finalUrl: result.finalUrl,
      responseTimeMs: result.responseTimeMs,
      https: result.finalUrl?.startsWith("https:") ?? null,
      error: result.error,
      checkedAt: new Date().toISOString(),
    };
  }

  db.prepare(`
    INSERT INTO website_checks (id, business_id, status, http_status, final_url, response_time_ms, https, error, checked_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    nanoid(), businessId, verification.status, verification.httpStatus,
    verification.finalUrl, verification.responseTimeMs,
    verification.https === null ? null : verification.https ? 1 : 0,
    verification.error, verification.checkedAt
  );
  db.prepare("UPDATE businesses SET website_status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(verification.status, businessId);

  return verification;
}