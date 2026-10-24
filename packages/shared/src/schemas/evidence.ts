import { z } from "zod";

export const EvidenceSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  investigationId: z.string().nullable(),
  type: z.string(),
  claim: z.string(),
  sourceUrl: z.string().nullable(),
  sourceId: z.string().nullable(),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  verificationStatus: z.enum(["OBSERVED", "INFERRED", "UNVERIFIED"]),
  metadata: z.record(z.unknown()).nullable(),
  observedAt: z.string(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;