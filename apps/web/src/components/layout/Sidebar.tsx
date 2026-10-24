import { Building2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Compass, Users, Sparkles, Mail, KanbanSquare,
  BarChart3, Activity, Settings,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/investigations", label: "Investigations", icon: Sparkles },
  { to: "/outreach", label: "Outreach", icon: Mail },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/agent-activity", label: "Agent Activity", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/businesses", label: "Businesses", icon: Building2 },
];

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-border bg-bg-elevated flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="text-lg font-semibold tracking-tight">FODX Scout</div>
        <div className="text-xs text-gray-500 mt-0.5">Prospecting workspace</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-bg-muted text-white border-l-2 border-accent"
                  : "text-gray-400 hover:text-gray-100 hover:bg-bg-muted/60"
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-border text-xs text-gray-500">v0.1 MVP · local only</div>
    </aside>
  );
}