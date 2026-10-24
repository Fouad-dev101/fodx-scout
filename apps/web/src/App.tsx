import { BusinessesPage } from "./features/businesses/BusinessesPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DiscoveryPage } from "./features/discovery/DiscoveryPage";
import { LeadsPage } from "./features/leads/LeadsPage";
import { LeadDetailPage } from "./features/leads/LeadDetailPage";
import { InvestigationsPage } from "./features/investigations/InvestigationsPage";
import { InvestigationDetailPage } from "./features/investigations/InvestigationDetailPage";
import { OutreachPage } from "./features/outreach/OutreachPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { PipelinePage } from "./features/pipeline/PipelinePage";
import { ReportsPage } from "./features/reports/ReportsPage";
import { AgentActivityPage } from "./features/agent-activity/AgentActivityPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/businesses" element={<BusinessesPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/discover" element={<DiscoveryPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
        <Route path="/outreach" element={<OutreachPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/agent-activity" element={<AgentActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}