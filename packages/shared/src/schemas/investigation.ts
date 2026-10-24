import { z } from "zod";

export const InvestigationStatusEnum = z.enum([
  "PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED",
]);
export type InvestigationStatus = z.infer<typeof InvestigationStatusEnum>;

export const InvestigationEventSchema = z.object({
  id: z.string(),
  investigationId: z.string(),
  seq: z.number(),
  kind: z.enum(["STATUS", "TOOL_CALL", "TOOL_RESULT", "MESSAGE", "ERROR"]),
  toolName: z.string().nullable(),
  status: z.enum(["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "SKIPPED"]).nullable(),
  payload: z.unknown(),
  createdAt: z.string(),
});
export type InvestigationEvent = z.infer<typeof InvestigationEventSchema>;