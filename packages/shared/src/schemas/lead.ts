import { z } from "zod";

export const LeadStatusEnum = z.enum([
  "NEW", "INVESTIGATING", "QUALIFIED", "READY_FOR_OUTREACH",
  "CONTACTED", "REPLIED", "MEETING", "WON", "LOST", "NOT_A_FIT",
]);
export type LeadStatus = z.infer<typeof LeadStatusEnum>;

export const LeadSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  status: LeadStatusEnum,
  notes: z.string().nullable(),
  nextFollowUpAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;