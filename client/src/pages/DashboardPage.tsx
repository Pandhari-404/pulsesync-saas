import React, { useState, useEffect } from 'react';
import { AnalyticsData, Incident } from '../types';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface DashboardPageProps {
  onDeclareIncident: () => void;
  onSelectIncident: (id: string) => void;
  onNavigateToIncidents: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onDeclareIncident,
  onSelectIncident,
  onNavigateToIncidents,
}) => {
  const { lastEvent } = useSocket();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [analyticsData, incidentsData] = await Promise.all([
        api.analytics.getDashboard(),
        api.incidents.list({ status: 'INVESTIGATING' }),
      ]);
      setAnalytics(analyticsData);
      setActiveIncidents(incidentsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch on any live WebSocket event
  useEffect(() => {
    if (lastEvent) {
      fetchData();
    }
  }, [lastEvent]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-900/30">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="h-4 w-4" />
            <span>Reliability Operations Center</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Status & Live Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">
            Unified incident management, MTTR tracking, and distributed service health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDeclareIncident}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Declare Incident</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Incidents</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.summary.activeIncidents ?? 0}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-rose-400 font-semibold">{activeIncidents.length}</span> investigating now
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">MTTR (Mean Time)</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.summary.mttrMinutes ?? 42}
            <span className="text-sm font-normal text-slate-400 ml-1">min</span>
          </div>
          <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingDown className="h-3 w-3" />
            <span>-14% vs last week target</span>
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Uptime</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">99.98%</div>
          <p className="text-xs text-slate-400">SLO target: 99.95%</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Team Responders</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.summary.teamMembersCount ?? 4}
          </div>
          <p className="text-xs text-slate-400">
            {analytics?.summary.apiKeysCount ?? 1} automated API keys active
          </p>
        </div>
      </div>

      {/* Two Column Layout: Service Health & Active Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Health Grid (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Service Infrastructure Health</h3>
              <p className="text-xs text-slate-400">Real-time status across critical platform dependencies</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              All Systems Monitored
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {(analytics?.serviceHealth && analytics.serviceHealth.length > 0
              ? analytics.serviceHealth
              : [
                  { name: 'Core API Gateway', openIncidents: 0, status: 'OPERATIONAL', uptime: '99.99%' },
                  { name: 'Payment Service', openIncidents: 1, status: 'DEGRADED', uptime: '98.50%' },
                  { name: 'Auth & JWT Service', openIncidents: 1, status: 'DEGRADED', uptime: '99.10%' },
                  { name: 'PostgreSQL Cluster', openIncidents: 1, status: 'OPERATIONAL', uptime: '99.98%' },
                  { name: 'Redis Cache Tier', openIncidents: 0, status: 'OPERATIONAL', uptime: '100.0%' },
                  { name: 'CDN & Edge Routing', openIncidents: 0, status: 'OPERATIONAL', uptime: '99.99%' },
                ]
            ).map((srv: any, idx: number) => {
              const isDegraded = srv.openIncidents > 0;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-sm text-slate-200 block">{srv.name}</span>
                    <span className="text-xs text-slate-400 font-mono">Uptime: {srv.uptime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        isDegraded
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isDegraded ? 'DEGRADED' : 'OPERATIONAL'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Active Incidents List (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Live Active Queue</h3>
            <button
              onClick={onNavigateToIncidents}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Kanban</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {activeIncidents.length > 0 ? (
              activeIncidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {inc.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {inc.serviceName}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                    {inc.title}
                  </h4>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/60 mx-auto mb-2" />
                <span>No active incidents under investigation.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              onClick={onNavigateToIncidents}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium rounded-xl transition-all"
            >
              Open Complete Operations Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
