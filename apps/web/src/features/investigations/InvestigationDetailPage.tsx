import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";

interface EventRow {
  id: string; seq: number; kind: string; toolName: string | null;
  status: string | null; payload: unknown; createdAt: string;
}

export function InvestigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const inv = useQuery({ queryKey: ["investigation", id], queryFn: () => api.investigation(id!), enabled: !!id, refetchInterval: 3000 });
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!id) return;
    let lastSeq = 0;
    const es = new EventSource(`/api/investigations/${id}/events?since=0`);
    es.addEventListener("update", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as EventRow;
        if (data.seq > lastSeq) {
          lastSeq = data.seq;
          setEvents((cur) => {
            if (cur.some((e) => e.id === data.id)) return cur;
            return [...cur, data].sort((a, b) => a.seq - b.seq);
          });
        }
      } catch { /* ignore */ }
    });
    es.onerror = () => { /* EventSource auto-reconnects */ };
    return () => es.close();
  }, [id]);

  const cancel = async () => {
    if (id) await api.cancelInvestigation(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{inv.data?.title ?? "Investigation"}</h1>
        <div className="flex items-center gap-2">
          {inv.data && (
            <StatusBadge tone={inv.data.status === "COMPLETED" ? "success" : inv.data.status === "FAILED" ? "danger" : inv.data.status === "CANCELLED" ? "warning" : "neutral"}>
              {inv.data.status}
            </StatusBadge>
          )}
          {inv.data && (inv.data.status === "RUNNING" || inv.data.status === "PENDING") && (
            <button onClick={cancel} className="text-xs px-2 py-1 border border-border rounded hover:border-red-500">Cancel</button>
          )}
        </div>
      </div>

      <Card title="Objective">
        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">{inv.data?.task}</pre>
      </Card>

      {inv.data?.error && <Card title="Error"><div className="text-sm text-red-400">{inv.data.error}</div></Card>}
      {inv.data?.summary && <Card title="Summary"><pre className="whitespace-pre-wrap text-sm font-sans text-gray-200">{inv.data.summary}</pre></Card>}

      <Card title="Execution timeline">
        {events.length === 0 ? <div className="text-xs text-gray-500">Waiting for events…</div> : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border-l-2 border-border pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{e.seq}</span>
                  <span className="text-xs uppercase tracking-wide text-gray-400">{e.kind}</span>
                  {e.toolName && <span className="text-xs text-accent font-mono">{e.toolName}</span>}
                  {e.status && <StatusBadge tone={e.status === "SUCCEEDED" ? "success" : e.status === "FAILED" ? "danger" : "neutral"}>{e.status}</StatusBadge>}
                </div>
                <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{JSON.stringify(e.payload, null, 2).slice(0, 1200)}</pre>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}