import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { logger } from "../logging/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  const dir = join(__dirname, "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const row = db.prepare("SELECT name FROM _migrations WHERE name = ?").get(file);
    if (row) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
      db.exec("COMMIT");
      logger.info("migration.applied", { file });
    } catch (err) {
      db.exec("ROLLBACK");
      logger.error("migration.failed", { file, error: String(err) });
      throw err;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  logger.info("migrations.done");
}