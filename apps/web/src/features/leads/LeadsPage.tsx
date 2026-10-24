import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScoreIndicator } from "../../components/ui/ScoreIndicator";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function LeadsPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const query = useQuery({
    queryKey: ["leads", status, q],
    queryFn: () => api.leads(params.toString()),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Leads</h1>
      <Card>
        <div className="flex gap-2 mb-3">
          <input
            placeholder="Search by name or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-bg-muted border border-border rounded px-2 py-1.5 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-bg-muted border border-border rounded px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {["NEW","INVESTIGATING","QUALIFIED","READY_FOR_OUTREACH","CONTACTED","REPLIED","MEETING","WON","LOST","NOT_A_FIT"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {query.isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {query.data && query.data.rows.length === 0 && (
          <EmptyState
            title="No leads"
            description="Convert a discovered business into a lead from its detail page."
            action={<Link to="/discover" className="text-sm px-3 py-1.5 bg-accent rounded">Discover</Link>}
          />
        )}
        {query.data && query.data.rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">City</th>
                <th className="text-left p-2">Score</th>
                <th className="text-left p-2">Drafts</th>
              </tr>
            </thead>
            <tbody>
              {query.data.rows.map((l) => (
                <tr key={l.id} className="border-t border-border/60">
                  <td className="p-2">
                    <Link to={`/leads/${l.id}`} className="text-gray-100 hover:text-accent">{l.name}</Link>
                  </td>
                  <td className="p-2"><StatusBadge>{l.status}</StatusBadge></td>
                  <td className="p-2 text-gray-400">{l.city ?? "—"}</td>
                  <td className="p-2"><ScoreIndicator score={l.opportunity_score} /></td>
                  <td className="p-2 text-gray-400">{l.draft_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}