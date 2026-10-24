import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { StatusBadge } from "../ui/StatusBadge";

export function Header() {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 20000 });
  const aiOk = health.data?.ai.configured;
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6">
      <div className="text-sm text-gray-400">Business intelligence & prospect discovery</div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">AI</span>
        <StatusBadge tone={aiOk ? "success" : "neutral"}>
          {health.data?.ai.provider ? `${health.data.ai.provider} ${aiOk ? "ready" : "unconfigured"}` : "disabled"}
        </StatusBadge>
      </div>
    </header>
  );
}