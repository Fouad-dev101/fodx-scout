import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import type { Evidence } from "@fodx/shared";

export function addEvidence(input: Omit<Evidence, "id" | "observedAt"> & { observedAt?: string }): Evidence {
  const id = nanoid();
  const observedAt = input.observedAt ?? new Date().toISOString();
  db.prepare(`
    INSERT INTO evidence
    (id, business_id, investigation_id, type, claim, source_url, source_id, confidence, verification_status, metadata, observed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, input.businessId, input.investigationId, input.type, input.claim,
    input.sourceUrl, input.sourceId, input.confidence, input.verificationStatus,
    input.metadata ? JSON.stringify(input.metadata) : null, observedAt
  );
  return { ...input, id, observedAt };
}

export function listEvidenceForBusiness(businessId: string): Evidence[] {
  const rows = db.prepare(
    "SELECT * FROM evidence WHERE business_id = ? ORDER BY observed_at DESC"
  ).all(businessId) as Array<{
    id: string; business_id: string; investigation_id: string | null;
    type: string; claim: string; source_url: string | null; source_id: string | null;
    confidence: string; verification_status: string; metadata: string | null; observed_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    businessId: r.business_id,
    investigationId: r.investigation_id,
    type: r.type,
    claim: r.claim,
    sourceUrl: r.source_url,
    sourceId: r.source_id,
    confidence: r.confidence as Evidence["confidence"],
    verificationStatus: r.verification_status as Evidence["verificationStatus"],
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    observedAt: r.observed_at,
  }));
}