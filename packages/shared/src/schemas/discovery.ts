import { z } from "zod";

export const DiscoveryCategories = [
  "restaurant", "cafe", "hotel", "riad", "gym", "fitness_center",
  "hair_salon", "barbershop", "dentist", "medical_clinic",
  "retail", "car_rental", "real_estate", "travel_agency",
  "training_center",
] as const;
export type DiscoveryCategory = (typeof DiscoveryCategories)[number];

export const DiscoverySearchInput = z.object({
  country: z.string().min(1).max(64).default("Morocco"),
  city: z.string().min(1).max(64),
  categories: z.array(z.enum(DiscoveryCategories)).min(1),
  radiusMeters: z.number().int().min(500).max(50000).default(5000),
  maxResults: z.number().int().min(1).max(200).default(50),
  keywords: z.string().max(120).optional(),
});
export type DiscoverySearchInput = z.infer<typeof DiscoverySearchInput>;

export const DiscoveredBusinessPreview = z.object({
  sourceId: z.string(),
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
  source: z.literal("osm"),
  sourceUrl: z.string().nullable(),
});
export type DiscoveredBusinessPreview = z.infer<typeof DiscoveredBusinessPreview>;

export const DiscoverySearchResult = z.object({
  searchId: z.string(),
  query: DiscoverySearchInput,
  fetched: DiscoveredBusinessPreview,
  totalFound: z.number(),
  duplicatesSkipped: z.number(),
  alreadyStored: z.number(),
  warnings: z.array(z.string()),
  retrievedAt: z.string(),
});
export type DiscoverySearchResult = z.infer<typeof DiscoverySearchResult>;