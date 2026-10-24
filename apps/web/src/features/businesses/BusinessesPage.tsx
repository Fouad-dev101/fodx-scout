import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { ScoreIndicator } from "../../components/ui/ScoreIndicator";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function BusinessesPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["businesses"], queryFn: () => api.businesses() });

  const makeLead = useMutation({
    mutationFn: (businessId: string) => api.createLead(businessId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      nav(`/leads/${data.id}`);
    },
    onError: (err) => alert(`Failed to create lead: ${err.message}`)
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Stored Businesses</h1>
      <Card>
        {q.isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {q.data && q.data.rows.length === 0 && <div className="text-sm text-gray-500">No businesses imported yet. Go to Discover to import some.</div>}
        
        {q.data && q.data.rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 border-b border-border">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">City</th>
                <th className="text-left p-2">Website Status</th>
                <th className="text-left p-2">Score</th>
                <th className="text-right p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {q.data.rows.map((b) => (
                <tr key={b.id} className="border-b border-border/50">
                  <td className="p-2">{b.name}</td>
                  <td className="p-2 text-gray-400">{b.category ?? "—"}</td>
                  <td className="p-2 text-gray-400">{b.city ?? "—"}</td>
                  <td className="p-2"><StatusBadge>{b.website_status}</StatusBadge></td>
                  <td className="p-2"><ScoreIndicator score={b.opportunity_score} /></td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => makeLead.mutate(b.id)}
                      disabled={makeLead.isPending}
                      className="text-xs px-2 py-1 bg-accent hover:bg-accent-soft rounded disabled:opacity-50"
                    >
                      {makeLead.isPending ? "Creating…" : "Make Lead →"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}