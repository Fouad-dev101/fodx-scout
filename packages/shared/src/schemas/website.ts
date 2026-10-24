import { z } from "zod";

export const WebsiteVerificationSchema = z.object({
  status: z.enum([
    "VERIFIED_ACCESSIBLE",
    "PROVIDED_BUT_UNVERIFIED",
    "NO_WEBSITE_DISCOVERED",
    "VERIFICATION_FAILED",
    "NEEDS_MANUAL_REVIEW",
  ]),
  httpStatus: z.number().nullable(),
  finalUrl: z.string().nullable(),
  responseTimeMs: z.number().nullable(),
  https: z.boolean().nullable(),
  error: z.string().nullable(),
  checkedAt: z.string(),
});
export type WebsiteVerification = z.infer<typeof WebsiteVerificationSchema>;

export const WebsiteInspectionSchema = z.object({
  finalUrl: z.string(),
  https: z.boolean(),
  httpStatus: z.number(),
  responseTimeMs: z.number(),
  title: z.string().nullable(),
  metaDescription: z.string().nullable(),
  canonical: z.string().nullable(),
  lang: z.string().nullable(),
  hasViewport: z.boolean(),
  h1: z.array(z.string()),
  imageCount: z.number(),
  imagesMissingAlt: z.number(),
  hasNav: z.boolean(),
  hasContactLink: z.boolean(),
  hasTelLink: z.boolean(),
  hasMailtoLink: z.boolean(),
  hasAddressHint: z.boolean(),
  hasReservationHint: z.boolean(),
  findings: z.array(z.string()),
  inconclusive: z.array(z.string()),
  inspectedAt: z.string(),
});
export type WebsiteInspection = z.infer<typeof WebsiteInspectionSchema>;