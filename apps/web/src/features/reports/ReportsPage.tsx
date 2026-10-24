import { Card } from "../../components/ui/Card";

export function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reports</h1>
      <Card title="Export">
        <p className="text-sm text-gray-300 mb-3">
          Exports include only data stored in this workspace. Formula-injection characters are escaped.
        </p>
        <a
          href="/api/reports/leads.csv"
          className="inline-block text-sm px-3 py-1.5 bg-accent hover:bg-accent-soft rounded"
        >
          Download leads.csv
        </a>
      </Card>
    </div>
  );
}