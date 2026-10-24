import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ScoreIndicator } from "../../components/ui/ScoreIndicator";

export function DashboardPage() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (q.isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40" /></div>;
  if (q.isError) return <div className="text-red-400 text-sm">Failed to load dashboard: {String(q.error)}</div>;
  if (!q.data) return null;

  const m = q.data.metrics;
  const isEmptiness = q.data.emptiness;

  const stat = (label: string, value: number) => (
    <div className="border border-border rounded-md p-4 bg-bg-elevated">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link to="/investigations" className="text-sm px-3 py-1.5 bg-accent hover:bg-accent-soft rounded">
          New Investigation
        </Link>
      </div>

      {isEmptiness ? (
        <EmptyState
          title="No businesses yet"
          description="Start by discovering real businesses from OpenStreetMap."
          action={<Link to="/discover" className="text-sm px-3 py-1.5 bg-accent rounded">Discover Businesses</Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stat("Total businesses", m.totalBusinesses!)}
            {stat("Verified websites", m.verifiedWebsites!)}
            {stat("No website found", m.noWebsite!)}
            {stat("High priority (≥60)", m.highPriority!)}
            {stat("Investigations", m.investigationsCompleted!)}
            {stat("Drafts created", m.draftsCreated!)}
            {stat("Awaiting follow-up", m.leadsAwaitingFollowUp!)}
            {stat("Contacted", m.leadsContacted!)}
            {stat("Won", m.leadsWon!)}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Latest investigations">
              {q.data.recentInvestigations.length === 0 ? (
                <div className="text-xs text-gray-500">No investigations yet.</div>
              ) : (
                <ul className="space-y-2">
                  {q.data.recentInvestigations.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between text-sm">
                      <Link to={`/investigations/${inv.id}`} className="text-gray-200 hover:text-white">
                        {inv.title}
                      </Link>
                      <StatusBadge tone={inv.status === "COMPLETED" ? "success" : inv.status === "FAILED" ? "danger" : "neutral"}>
                        {inv.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Top priority prospects">
              {q.data.highPriorityProspects.length === 0 ? (
                <div className="text-xs text-gray-500">No scored prospects yet.</div>
              ) : (
                <ul className="space-y-2">
                  {q.data.highPriorityProspects.map((b) => (
                    <li key={b.id} className="flex items-center justify-between text-sm">
                      <span>{b.name} <span className="text-xs text-gray-500">{b.city ?? ""}</span></span>
                      <ScoreIndicator score={b.opportunity_score} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}