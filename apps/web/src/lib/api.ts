const base = "";

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => j<{ ok: boolean; ai: { provider: string | null; configured: boolean } }>("/api/health"),
  dashboard: () => j<DashboardSummary>("/api/dashboard/summary"),
  discoveryPreview: (body: unknown) => j<DiscoveryPreview>("/api/discovery/preview", { method: "POST", body: JSON.stringify(body) }),
  discoveryImport: (searchId: string, selectedSourceIds: string[]) =>
    j<{ imported: number; skipped: number }>("/api/discovery/import", {
      method: "POST", body: JSON.stringify({ searchId, selectedSourceIds }),
    }),
  businesses: (page = 1) => j<{ rows: BusinessRow[]; total: number }>(`/api/businesses?page=${page}`),
  business: (id: string) => j<BusinessDetail>(`/api/businesses/${id}`),
  createLead: (businessId: string) => j<{ id: string }>("/api/leads", { method: "POST", body: JSON.stringify({ businessId }) }),
  verifyWebsite: (id: string) => j<unknown>(`/api/businesses/${id}/verify-website`, { method: "POST" }),
  inspectWebsite: (id: string) => j<unknown>(`/api/businesses/${id}/inspect-website`, { method: "POST" }),
  scoreBusiness: (id: string) => j<unknown>(`/api/businesses/${id}/score`, { method: "POST" }),
  evidence: (id: string) => j<EvidenceRow[]>(`/api/businesses/${id}/evidence`),
  leads: (params = "") => j<{ rows: LeadRow[]; total: number; page: number; pageSize: number }>(`/api/leads?${params}`),
  lead: (id: string) => j<{ lead: LeadDetail; drafts: DraftRow[] }>(`/api/leads/${id}`),
  createLead: (businessId: string) => j<{ id: string }>("/api/leads", { method: "POST", body: JSON.stringify({ businessId }) }),
  updateLead: (id: string, patch: unknown) => j<{ ok: true }>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  investigations: () => j<InvestigationRow[]>("/api/investigations"),
  investigation: (id: string) => j<InvestigationRow>(`/api/investigations/${id}`),
  startInvestigation: (body: { title: string; task: string; city?: string; resultLimit?: number }) =>
    j<{ id: string }>("/api/investigations", { method: "POST", body: JSON.stringify(body) }),
  cancelInvestigation: (id: string) => j<unknown>(`/api/investigations/${id}/cancel`, { method: "POST" }),
  generateDraft: (body: unknown) => j<{ id: string; body: string; subject: string | null }>("/api/outreach/generate", { method: "POST", body: JSON.stringify(body) }),
  drafts: () => j<DraftRow[]>("/api/outreach/drafts"),
  approveDraft: (id: string) => j<{ ok: true }>(`/api/outreach/drafts/${id}/approve`, { method: "POST" }),
  updateDraft: (id: string, body: unknown) => j<{ ok: true }>(`/api/outreach/drafts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  settings: () => j<SettingsResponse>("/api/settings"),
};

export interface DashboardSummary {
  metrics: Record<string, number>;
  pipeline: Array<{ status: string; c: number }>;
  recentInvestigations: Array<{ id: string; title: string; status: string; created_at: string }>;
  highPriorityProspects: Array<{ id: string; name: string; city: string | null; website_status: string; opportunity_score: number }>;
  emptiness: boolean;
}
export interface DiscoveryPreview {
  searchId: string; totalFound: number; duplicatesSkipped: number; alreadyStored: number;
  results: Array<{
    sourceId: string; name: string; category: string | null; city: string | null;
    phone: string | null; email: string | null; websiteUrl: string | null;
  }>;
  warnings: string[];
}
export interface BusinessRow {
  id: string; name: string; category: string | null; city: string | null;
  website_url: string | null; website_status: string; opportunity_score: number | null;
}
export interface BusinessDetail extends BusinessRow {
  phone: string | null; email: string | null; address: string | null; source_url: string | null;
  score_breakdown: string | null;
}
export interface EvidenceRow {
  id: string; type: string; claim: string; confidence: string;
  verificationStatus: string; observedAt: string;
}
export interface LeadRow {
  id: string; business_id: string; status: string; name: string; category: string | null;
  city: string | null; website_status: string; opportunity_score: number | null; draft_count: number;
  updated_at: string;
}
export interface LeadDetail extends LeadRow {
  notes: string | null; next_follow_up_at: string | null; phone: string | null; email: string | null;
}
export interface DraftRow {
  id: string; lead_id: string; language: string; style: string;
  subject: string | null; body: string; approved: number; created_at: string;
  business_name?: string;
}
export interface InvestigationRow {
  id: string; title: string; task: string; status: string;
  created_at: string; finished_at: string | null; summary: string | null; error: string | null;
}
export interface SettingsResponse {
  ai: { provider: string | null; model: string; baseUrl: string; apiKeyConfigured: boolean };
  discovery: Record<string, unknown>;
  webFetch: Record<string, unknown>;
  agent: Record<string, unknown>;
  note: string;
}