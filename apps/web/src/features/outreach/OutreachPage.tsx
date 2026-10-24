import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function OutreachPage() {
  const q = useQuery({ queryKey: ["drafts"], queryFn: api.drafts });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Outreach Studio</h1>
      <Card title="All drafts">
        {q.isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {q.data && q.data.length === 0 && (
          <EmptyState title="No drafts yet" description="Open a lead and generate a draft." />
        )}
        {q.data && q.data.length > 0 && (
          <ul className="space-y-3">
            {q.data.map((d) => (
              <li key={d.id} className="border border-border rounded p-3">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{d.business_name} · {d.language} · {d.style}</span>
                  <StatusBadge tone={d.approved ? "success" : "neutral"}>{d.approved ? "approved" : "draft"}</StatusBadge>
                </div>
                {d.subject && <div className="text-sm font-medium mb-1">{d.subject}</div>}
                <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans">{d.body}</pre>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}