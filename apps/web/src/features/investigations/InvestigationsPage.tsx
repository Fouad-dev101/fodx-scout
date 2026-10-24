import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";

export function InvestigationsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const list = useQuery({ queryKey: ["investigations"], queryFn: api.investigations });
  const [title, setTitle] = useState("Al Hoceima restaurants — website opportunities");
  const [task, setTask] = useState(
    "Discover up to 20 restaurants in Al Hoceima, Morocco. For each, verify any website URL, inspect accessible sites, compute opportunity scores, and record evidence for the strongest opportunities."
  );
  const create = useMutation({
    mutationFn: () => api.startInvestigation({ title, task, city: "Al Hoceima", resultLimit: 20 }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["investigations"] }); nav(`/investigations/${r.id}`); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">AI Investigations</h1>
      <Card title="New investigation">
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm" />
          <textarea value={task} onChange={(e) => setTask(e.target.value)} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm min-h-[100px]" />
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="px-3 py-1.5 bg-accent hover:bg-accent-soft rounded text-sm disabled:opacity-50"
          >
            {create.isPending ? "Starting…" : "Start investigation"}
          </button>
          {create.isError && <div className="text-xs text-red-400">{String(create.error)}</div>}
        </div>
      </Card>

      <Card title="Past investigations">
        {list.isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {list.data && list.data.length === 0 && (
          <EmptyState title="No investigations yet" description="Start your first investigation above." />
        )}
        {list.data && list.data.length > 0 && (
          <ul className="space-y-2">
            {list.data.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between border-t border-border/60 pt-2 text-sm">
                <Link to={`/investigations/${inv.id}`} className="text-gray-200 hover:text-white">{inv.title}</Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleString()}</span>
                  <StatusBadge tone={inv.status === "COMPLETED" ? "success" : inv.status === "FAILED" ? "danger" : inv.status === "CANCELLED" ? "warning" : "neutral"}>{inv.status}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}