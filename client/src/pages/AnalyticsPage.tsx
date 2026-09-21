import React, { useState, useEffect } from 'react';
import { AnalyticsData } from '../types';
import { api } from '../api/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { BarChart3, TrendingDown, Clock, ShieldCheck, Activity } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.analytics.getDashboard();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const severityData = analytics
    ? [
        { name: 'Critical (P0)', count: analytics.severityCounts.CRITICAL, fill: '#f43f5e' },
        { name: 'High (P1)', count: analytics.severityCounts.HIGH, fill: '#f59e0b' },
        { name: 'Medium (P2)', count: analytics.severityCounts.MEDIUM, fill: '#eab308' },
        { name: 'Low (P3)', count: analytics.severityCounts.LOW, fill: '#38bdf8' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Observability & MTTR Analytics</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Mean Time To Resolution, incident velocity, and reliability telemetry
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Mean Time To Resolution (MTTR)
          </span>
          <div className="text-3xl font-extrabold text-white flex items-baseline gap-2">
            <span>{analytics?.summary.mttrMinutes ?? 42}</span>
            <span className="text-sm text-slate-400 font-normal">minutes</span>
          </div>
          <span className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Target &lt; 60m achieved
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Incident Resolution Rate
          </span>
          <div className="text-3xl font-extrabold text-indigo-400">92.4%</div>
          <span className="text-xs text-slate-400 mt-1 block">Within initial SLA window</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Overall Platform Reliability
          </span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">99.98%</div>
          <span className="text-xs text-slate-400 mt-1 block">Exceeds 99.95% SLO</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Velocity Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">7-Day Incident Velocity</h3>
              <p className="text-xs text-slate-400">Reported vs Resolved incidents over the last 7 days</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.trends || []}>
                <defs>
                  <linearGradient id="reportedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" textAnchor="middle" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reported"
                  name="Reported"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reportedGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#resolvedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Incidents by Severity</h3>
              <p className="text-xs text-slate-400">Total distribution across impact levels</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Incidents" radius={[6, 6, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
