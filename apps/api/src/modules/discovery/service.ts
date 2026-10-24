import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import { logger } from "../../logging/logger.js";
import { discoverFromOsm } from "./overpass.js";
import type { DiscoverySearchInput, DiscoveredBusinessPreview } from "@fodx/shared";

export interface DiscoveryPreview {
  searchId: string;
  query: DiscoverySearchInput;
  results: DiscoveredBusinessPreview[];
  totalFound: number;
  duplicatesSkipped: number;
  alreadyStored: number;
  warnings: string[];
  retrievedAt: string;
}

// In-memory preview cache. Capped to prevent unbounded growth in dev.
const previews = new Map<string, DiscoveryPreview>();
const PREVIEW_TTL_MS = 30 * 60 * 1000;

function prune() {
  const cutoff = Date.now() - PREVIEW_TTL_MS;
  for (const [k, v] of previews) {
    if (new Date(v.retrievedAt).getTime() < cutoff) previews.delete(k);
  }
}

export async function previewDiscovery(input: DiscoverySearchInput): Promise<DiscoveryPreview> {
  const { results, warnings } = await discoverFromOsm(input);
  const seen = new Set<string>();
  const unique: DiscoveredBusinessPreview[] = [];
  let duplicatesSkipped = 0;
  for (const r of results) {
    const key = `${r.source}:${r.sourceId}`;
    if (seen.has(key)) { duplicatesSkipped++; continue; }
    seen.add(key);
    unique.push(r);
  }
  // Count already-stored
  let alreadyStored = 0;
  const stmt = db.prepare("SELECT 1 FROM businesses WHERE source = ? AND source_id = ?");
  for (const r of unique) {
    if (stmt.get(r.source, r.sourceId)) alreadyStored++;
  }
  prune();
  const preview: DiscoveryPreview = {
    searchId: nanoid(),
    query: input,
    results: unique,
    totalFound: unique.length,
    duplicatesSkipped,
    alreadyStored,
    warnings,
    retrievedAt: new Date().toISOString(),
  };
  previews.set(preview.searchId, preview);
  logger.info("discovery.preview", { searchId: preview.searchId, count: unique.length });
  return preview;
}

export function importPreview(searchId: string, selectedSourceIds: string[]): { imported: number; skipped: number } {
  const preview = previews.get(searchId);
  if (!preview) throw new Error("Preview not found or expired");
  const selected = new Set(selectedSourceIds);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO businesses
    (id, name, category, address, city, country, lat, lon, phone, email, website_url, website_status, source, source_id, source_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  let imported = 0, skipped = 0;
  db.exec("BEGIN");
  try {
    for (const r of preview.results) {
      if (selectedSourceIds.length > 0 && !selected.has(r.sourceId)) continue;
      const websiteStatus = r.websiteUrl ? "PROVIDED_BUT_UNVERIFIED" : "NO_WEBSITE_DISCOVERED";
      const info = insert.run(
        nanoid(), r.name, r.category, r.address, r.city, r.country,
        r.lat, r.lon, r.phone, r.email, r.websiteUrl, websiteStatus,
        r.source, r.sourceId, r.sourceUrl
      );
      if (info.changes > 0) imported++; else skipped++;
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { imported, skipped };
}