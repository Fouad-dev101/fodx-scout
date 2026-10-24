import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";

export function SettingsPage() {
  const q = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  if (q.isLoading || !q.data) return <div className="text-sm text-gray-500">Loading…</div>;
  const s = q.data;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card title="AI provider">
        <dl className="text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-gray-500">Provider</dt><dd>{s.ai.provider ?? "disabled"}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Model</dt><dd className="font-mono">{s.ai.model}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Base URL</dt><dd className="font-mono text-xs">{s.ai.baseUrl}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">API key configured</dt><dd><StatusBadge tone={s.ai.apiKeyConfigured ? "success" : "warning"}>{s.ai.apiKeyConfigured ? "yes" : "no"}</StatusBadge></dd></div>
        </dl>
        <p className="text-xs text-gray-500 mt-3">{s.note}</p>
      </Card>
      <Card title="Discovery"><pre className="text-xs font-mono text-gray-400">{JSON.stringify(s.discovery, null, 2)}</pre></Card>
      <Card title="Web fetching"><pre className="text-xs font-mono text-gray-400">{JSON.stringify(s.webFetch, null, 2)}</pre></Card>
      <Card title="Agent budgets"><pre className="text-xs font-mono text-gray-400">{JSON.stringify(s.agent, null, 2)}</pre></Card>
    </div>
  );
}