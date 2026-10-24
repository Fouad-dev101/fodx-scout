import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ScoreIndicator } from "../../components/ui/ScoreIndicator";

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["lead", id], queryFn: () => api.lead(id!), enabled: !!id });

  const ev = useQuery({
    queryKey: ["evidence", q.data?.lead.business_id],
    queryFn: () => api.evidence(q.data!.lead.business_id),
    enabled: !!q.data?.lead.business_id,
  });

  const [language, setLanguage] = useState<"fr" | "en" | "ar" | "ar-MA">("fr");
  const [style, setStyle] = useState<"friendly_local" | "professional" | "concise" | "consultative" | "premium">("friendly_local");
  const [draftError, setDraftError] = useState<string | null>(null);

  const genDraft = useMutation({
    mutationFn: () => api.generateDraft({ leadId: id, language, style }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
    onError: (e: Error) => setDraftError(e.message),
  });

  const updateLead = useMutation({
    mutationFn: (patch: unknown) => api.updateLead(id!, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });

  if (q.isLoading || !q.data) return <div className="text-sm text-gray-500">Loading…</div>;
  const { lead, drafts } = q.data;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{lead.name}</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Business">
          <dl className="text-sm space-y-1">
            <div className="flex justify-between"><dt className="text-gray-500">Category</dt><dd>{lead.category ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">City</dt><dd>{lead.city ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Website</dt><dd className="truncate max-w-[150px] text-right">{lead.website_url ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Website status</dt><dd><StatusBadge>{lead.website_status}</StatusBadge></dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Score</dt><dd><ScoreIndicator score={lead.opportunity_score} /></dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{lead.phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{lead.email ?? "—"}</dd></div>
          </dl>
        </Card>

        <Card title="Lead status">
          <select
            value={lead.status}
            onChange={(e) => updateLead.mutate({ status: e.target.value })}
            className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm"
          >
            {["NEW","INVESTIGATING","QUALIFIED","READY_FOR_OUTREACH","CONTACTED","REPLIED","MEETING","WON","LOST","NOT_A_FIT"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="mt-3">
            <label className="text-xs text-gray-500">Notes</label>
            <textarea
              defaultValue={lead.notes ?? ""}
              onBlur={(e) => updateLead.mutate({ notes: e.target.value || null })}
              className="mt-1 w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm min-h-[80px]"
            />
          </div>
        </Card>

        <Card title="Generate outreach">
          <div className="space-y-2 text-sm">
            <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="ar-MA">الدارجة</option>
            </select>
            <select value={style} onChange={(e) => setStyle(e.target.value as typeof style)} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5">
              <option value="friendly_local">Friendly · local</option>
              <option value="professional">Professional</option>
              <option value="concise">Concise</option>
              <option value="consultative">Consultative</option>
              <option value="premium">Premium</option>
            </select>
            <button
              onClick={() => { setDraftError(null); genDraft.mutate(); }}
              disabled={genDraft.isPending}
              className="w-full bg-accent hover:bg-accent-soft rounded text-sm py-1.5 disabled:opacity-50"
            >
              {genDraft.isPending ? "Generating…" : "Generate draft"}
            </button>
            {draftError && <div className="text-xs text-red-400">{draftError}</div>}
            <div className="text-xs text-gray-500">
              Falls back to a template if no AI provider is configured. Messages never claim facts outside the evidence below.
            </div>
          </div>
        </Card>
      </div>

      <Card title="Evidence">
        {ev.data?.length === 0 ? <div className="text-xs text-gray-500">No evidence recorded yet.</div> : (
          <ul className="space-y-2 text-sm">
            {ev.data?.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-t border-border/60 pt-2">
                <div>
                  <div className="text-gray-200">{e.claim}</div>
                  <div className="text-xs text-gray-500">{e.type} · {e.verificationStatus} · confidence {e.confidence}</div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(e.observedAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Drafts">
        {drafts.length === 0 ? <div className="text-xs text-gray-500">No drafts yet.</div> : (
          <ul className="space-y-3">
            {drafts.map((d) => (
              <li key={d.id} className="border border-border rounded p-3">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{d.language} · {d.style} {d.approved ? "· approved" : ""}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(d.body)}
                    className="text-accent hover:underline"
                  >Copy</button>
                </div>
                {d.subject && <div className="text-sm font-medium mb-1">{d.subject}</div>}
                <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans">{d.body}</pre>
                {!d.approved && (
                  <button
                    onClick={async () => {
                      await api.approveDraft(d.id);
                      qc.invalidateQueries({ queryKey: ["lead", id] });
                    }}
                    className="mt-2 text-xs text-emerald-400 hover:underline"
                  >Approve</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}