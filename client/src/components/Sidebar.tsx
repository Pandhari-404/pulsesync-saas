import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  Server,
  Users,
  Key,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incidents', label: 'Incidents Board', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics & MTTR', icon: BarChart3 },
    { id: 'monitoring', label: 'System Health', icon: Server },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'api-keys', label: 'API Keys', icon: Key },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/50 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Developer & Documentation Section */}
      <div className="pt-4 border-t border-slate-800/80 space-y-1">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Developer Tools
        </div>
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-indigo-400 hover:bg-slate-900/80 transition-all group"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <span>OpenAPI Docs</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
        </a>

        <a
          href="/health/metrics"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-900/80 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Server className="h-4 w-4 text-emerald-400" />
            <span>Prometheus</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
        </a>
      </div>
    </aside>
  );
};
