import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function AgentActivityPage() {
  const q = useQuery({ queryKey: ["investigations"], queryFn: api.investigations });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Agent Activity</h1>
      <Card title="Recent investigations">
        {q.data && q.data.length === 0 && <div className="text-sm text-gray-500">No investigations yet.</div>}
        <ul className="space-y-2">
          {q.data?.map((inv) => (
            <li key={inv.id} className="flex justify-between items-center text-sm border-t border-border/60 pt-2">
              <Link to={`/investigations/${inv.id}`} className="text-gray-200 hover:text-white">{inv.title}</Link>
              <StatusBadge tone={inv.status === "COMPLETED" ? "success" : inv.status === "FAILED" ? "danger" : "neutral"}>{inv.status}</StatusBadge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}