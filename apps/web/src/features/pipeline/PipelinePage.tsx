import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";

const STATUSES = ["NEW","INVESTIGATING","QUALIFIED","READY_FOR_OUTREACH","CONTACTED","REPLIED","MEETING","WON","LOST","NOT_A_FIT"];

export function PipelinePage() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
  const counts = new Map((q.data?.pipeline ?? []).map((p) => [p.status, p.c] as const));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pipeline</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUSES.map((s) => (
          <Card key={s} title={s}>
            <div className="text-2xl font-semibold tabular-nums">{counts.get(s) ?? 0}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}