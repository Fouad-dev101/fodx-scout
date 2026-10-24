import { z } from "zod";
import { previewDiscovery, importPreview } from "../modules/discovery/service.js";
import { verifyBusinessWebsite } from "../modules/website-analysis/verify.js";
import { inspectBusinessWebsite } from "../modules/website-analysis/inspect.js";
import { calculateOpportunityScore } from "../modules/scoring/score.js";
import { addEvidence, listEvidenceForBusiness } from "../modules/evidence/service.js";
import { db } from "../database/db.js";
import type { DiscoverySearchInput } from "@fodx/shared";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  schema: z.ZodType<unknown>;
  execute: (args: unknown) => Promise<unknown>;
}

const discoverSchema = z.object({
  city: z.string(),
  country: z.string().nullish().transform(v => v ?? "Morocco"),
  categories: z.array(z.string()).min(1),
  radiusMeters: z.number().int().nullish().transform(v => v ?? 5000),
  maxResults: z.number().int().nullish().transform(v => v ?? 30),
});

const businessIdSchema = z.object({ businessId: z.string() });

export const toolRegistry: Record<string, ToolDefinition> = {
  discover_businesses: {
    name: "discover_businesses",
    description: "Discover real businesses from OpenStreetMap via Overpass. Returns preview results — does not save them.",
    parameters: {
      type: "object",
      required: ["city", "categories"],
      properties: {
        city: { type: "string" },
        country: { type: ["string", "null"], description: "Optional country name" },
        categories: { type: "array", items: { type: "string" } },
        radiusMeters: { type: ["number", "null"], description: "Optional radius in meters" },
        maxResults: { type: ["number", "null"], description: "Optional max results" },
      },
    },
    schema: discoverSchema,
    async execute(raw) {
      const args = discoverSchema.parse(raw);
      const input: DiscoverySearchInput = {
        city: args.city,
        country: args.country,
        categories: args.categories as DiscoverySearchInput["categories"],
        radiusMeters: args.radiusMeters,
        maxResults: args.maxResults,
      };
      const preview = await previewDiscovery(input);
      return {
        searchId: preview.searchId,
        totalFound: preview.totalFound,
        results: preview.results.map((r) => ({
          sourceId: r.sourceId, name: r.name, category: r.category,
          websiteUrl: r.websiteUrl, phone: r.phone, city: r.city,
        })),
        warnings: preview.warnings,
      };
    },
  },

  import_discovery: {
    name: "import_discovery",
    description: "Persist a discovery preview into the local database.",
    parameters: {
      type: "object", required: ["searchId"],
      properties: { searchId: { type: "string" } },
    },
    schema: z.object({ searchId: z.string() }),
    async execute(raw) {
      const { searchId } = toolRegistry.import_discovery.schema.parse(raw) as { searchId: string };
      return importPreview(searchId, []);
    },
  },

  verify_website: {
    name: "verify_website",
    description: "Verify whether a stored business's website is reachable. Uses SSRF-safe HTTP.",
    parameters: {
      type: "object", required: ["businessId"],
      properties: { businessId: { type: "string" } },
    },
    schema: businessIdSchema,
    async execute(raw) {
      const { businessId } = businessIdSchema.parse(raw);
      return verifyBusinessWebsite(businessId);
    },
  },

  inspect_website: {
    name: "inspect_website",
    description: "Lightweight HTML inspection of a verified website. Not a comprehensive audit.",
    parameters: {
      type: "object", required: ["businessId"],
      properties: { businessId: { type: "string" } },
    },
    schema: businessIdSchema,
    async execute(raw) {
      const { businessId } = businessIdSchema.parse(raw);
      return inspectBusinessWebsite(businessId);
    },
  },

  calculate_opportunity_score: {
    name: "calculate_opportunity_score",
    description: "Compute deterministic opportunity score and persist it.",
    parameters: {
      type: "object", required: ["businessId"],
      properties: { businessId: { type: "string" } },
    },
    schema: businessIdSchema,
    async execute(raw) {
      const { businessId } = businessIdSchema.parse(raw);
      return calculateOpportunityScore(businessId);
    },
  },

  get_business_evidence: {
    name: "get_business_evidence",
    description: "Fetch all stored evidence for a business.",
    parameters: {
      type: "object", required: ["businessId"],
      properties: { businessId: { type: "string" } },
    },
    schema: businessIdSchema,
    async execute(raw) {
      const { businessId } = businessIdSchema.parse(raw);
      return listEvidenceForBusiness(businessId);
    },
  },

  save_evidence: {
    name: "save_evidence",
    description: "Store an evidence record for a business. The claim must be based on a real observation.",
    parameters: {
      type: "object", required: ["businessId", "type", "claim", "confidence", "verificationStatus"],
      properties: {
        businessId: { type: "string" }, type: { type: "string" },
        claim: { type: "string" }, 
        sourceUrl: { type: ["string", "null"], description: "Optional source URL" },
        sourceId: { type: ["string", "null"], description: "Optional source ID" },
        confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        verificationStatus: { type: "string", enum: ["OBSERVED", "INFERRED", "UNVERIFIED"] },
      },
    },
    schema: z.object({
      businessId: z.string(), type: z.string(), claim: z.string(),
      sourceUrl: z.string().nullish().transform(v => v ?? undefined), 
      sourceId: z.string().nullish().transform(v => v ?? undefined),
      confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
      verificationStatus: z.enum(["OBSERVED", "INFERRED", "UNVERIFIED"]),
    }),
    async execute(raw) {
      const a = toolRegistry.save_evidence.schema.parse(raw) as {
        businessId: string; type: string; claim: string;
        sourceUrl?: string; sourceId?: string;
        confidence: "LOW" | "MEDIUM" | "HIGH";
        verificationStatus: "OBSERVED" | "INFERRED" | "UNVERIFIED";
      };
      return addEvidence({
        businessId: a.businessId, investigationId: null, type: a.type, claim: a.claim,
        sourceUrl: a.sourceUrl ?? null, sourceId: a.sourceId ?? null,
        confidence: a.confidence, verificationStatus: a.verificationStatus,
        metadata: null,
      });
    },
  },

  list_businesses: {
    name: "list_businesses",
    description: "List saved businesses matching optional filters.",
    parameters: {
      type: "object",
      properties: {
        city: { type: ["string", "null"], description: "Optional city to filter by" },
        limit: { type: ["number", "null"], description: "Optional max number of results (1-100)" },
      },
    },
    schema: z.object({ 
      city: z.string().nullish().transform(v => v ?? undefined), 
      limit: z.number().int().min(1).max(100).nullish().transform(v => v ?? undefined) 
    }),
    async execute(raw) {
      const a = toolRegistry.list_businesses.schema.parse(raw) as { city?: string; limit?: number };
      const limit = a.limit ?? 25;
      const rows = a.city
        ? db.prepare("SELECT id, name, category, city, website_url, website_status, opportunity_score FROM businesses WHERE city = ? ORDER BY opportunity_score DESC NULLS LAST LIMIT ?").all(a.city, limit)
        : db.prepare("SELECT id, name, category, city, website_url, website_status, opportunity_score FROM businesses ORDER BY opportunity_score DESC NULLS LAST LIMIT ?").all(limit);
      return rows;
    },
  },
};