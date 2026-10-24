import { describe, it, expect, beforeEach } from "vitest";
import { nanoid } from "nanoid";
import { db } from "../../database/db.js";
import { runMigrations } from "../../database/migrate.js";
import { calculateOpportunityScore } from "./score.js";

describe("scoring", () => {
  beforeEach(() => { runMigrations(); });

  it("scores no-website businesses with contact + address as high", () => {
    const id = nanoid();
    db.prepare(`
      INSERT INTO businesses (id, name, category, address, city, phone, website_url, website_status, source, source_id)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(id, "Test", "restaurant", "1 rue X", "Al Hoceima", "0600000000", null, "NO_WEBSITE_DISCOVERED", "osm", nanoid());
    const breakdown = calculateOpportunityScore(id);
    expect(breakdown.total).toBeGreaterThanOrEqual(50);
    expect(breakdown.warnings.length).toBeGreaterThan(0);
    expect(breakdown.components.some((c) => c.key === "noWebsite")).toBe(true);
  });

  it("clamps to 100", () => {
    const id = nanoid();
    db.prepare(`
      INSERT INTO businesses (id, name, category, address, city, phone, website_url, website_status, source, source_id)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(id, "Test", "restaurant", "1 rue X", "Al Hoceima", "0600000000", null, "NO_WEBSITE_DISCOVERED", "osm", nanoid());
    const breakdown = calculateOpportunityScore(id);
    expect(breakdown.total).toBeLessThanOrEqual(100);
    expect(breakdown.total).toBeGreaterThanOrEqual(0);
  });
});