import { z } from "zod";

export const WebsiteStatusEnum = z.enum([
  "VERIFIED_ACCESSIBLE",
  "PROVIDED_BUT_UNVERIFIED",
  "NO_WEBSITE_DISCOVERED",
  "VERIFICATION_FAILED",
  "NEEDS_MANUAL_REVIEW",
]);
export type WebsiteStatus = z.infer<typeof WebsiteStatusEnum>;

export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  websiteStatus: WebsiteStatusEnum,
  source: z.string(),
  sourceId: z.string(),
  sourceUrl: z.string().nullable(),
  opportunityScore: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const ScoreBreakdownSchema = z.object({
  total: z.number().min(0).max(100),
  components: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      weight: z.number(),
      rawValue: z.number(),
      contribution: z.number(),
      reason: z.string(),
    })
  ),
  warnings: z.array(z.string()),
  computedAt: z.string(),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;