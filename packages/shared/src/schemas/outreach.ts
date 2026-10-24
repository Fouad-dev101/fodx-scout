import { z } from "zod";

export const OutreachLanguageEnum = z.enum(["fr", "ar-MA", "ar", "en"]);
export const OutreachStyleEnum = z.enum([
  "friendly_local", "professional", "concise", "consultative", "premium",
]);

export const GenerateDraftInput = z.object({
  leadId: z.string(),
  language: OutreachLanguageEnum.default("fr"),
  style: OutreachStyleEnum.default("friendly_local"),
});
export type GenerateDraftInput = z.infer<typeof GenerateDraftInput>;