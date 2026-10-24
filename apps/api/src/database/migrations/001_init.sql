CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  lat REAL,
  lon REAL,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  website_status TEXT NOT NULL DEFAULT 'NO_WEBSITE_DISCOVERED',
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_url TEXT,
  opportunity_score REAL,
  score_breakdown TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source, source_id)
);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_score ON businesses(opportunity_score DESC);

CREATE TABLE IF NOT EXISTS website_checks (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  http_status INTEGER,
  final_url TEXT,
  response_time_ms INTEGER,
  https INTEGER,
  error TEXT,
  checked_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wchecks_business ON website_checks(business_id);

CREATE TABLE IF NOT EXISTS website_inspections (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  final_url TEXT NOT NULL,
  report TEXT NOT NULL,
  inspected_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_winsp_business ON website_inspections(business_id);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  investigation_id TEXT,
  type TEXT NOT NULL,
  claim TEXT NOT NULL,
  source_url TEXT,
  source_id TEXT,
  confidence TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  metadata TEXT,
  observed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_business ON evidence(business_id);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NEW',
  notes TEXT,
  next_follow_up_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

CREATE TABLE IF NOT EXISTS lead_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS investigations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  city TEXT,
  categories TEXT,
  result_limit INTEGER,
  summary TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_inv_status ON investigations(status);

CREATE TABLE IF NOT EXISTS investigation_events (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL,
  tool_name TEXT,
  status TEXT,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_inv ON investigation_events(investigation_id, seq);

CREATE TABLE IF NOT EXISTS investigation_businesses (
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  PRIMARY KEY (investigation_id, business_id)
);

CREATE TABLE IF NOT EXISTS outreach_drafts (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  style TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_drafts_lead ON outreach_drafts(lead_id);

CREATE TABLE IF NOT EXISTS application_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);