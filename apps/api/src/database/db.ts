import Database from "better-sqlite3";
import { env } from "../config/env.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../logging/logger.js";

mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });
export const db = new Database(env.DATABASE_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

logger.info("database.opened", { path: env.DATABASE_PATH });