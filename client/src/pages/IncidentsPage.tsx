import React, { useState, useEffect } from 'react';
import { Incident, IncidentStatus, IncidentSeverity } from '../types';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { IncidentCard } from '../components/IncidentCard';
import {
  Search,
  Filter,
  Plus,
  AlertCircle,
  Eye,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface IncidentsPageProps {
  onDeclareIncident: () => void;
  onSelectIncident: (id: string) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  onDeclareIncident,
  onSelectIncident,
}) => {
  const { lastEvent } = useSocket();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await api.incidents.list({
        search: searchQuery || undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
      });
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter]);

  // Handle live WebSocket updates seamlessly
  useEffect(() => {
    if (lastEvent) {
      fetchIncidents();
    }
  }, [lastEvent]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  const columns: { status: IncidentStatus; label: string; icon: any; color: string }[] = [
    { status: 'INVESTIGATING', label: 'Investigating', icon: AlertCircle, color: 'text-rose-400 border-rose-500/30 bg-rose-950/20' },
    { status: 'IDENTIFIED', label: 'Identified', icon: Eye, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
    { status: 'MONITORING', label: 'Monitoring Fix', icon: Clock, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20' },
    { status: 'RESOLVED', label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Incident Operations Board</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tenant incident response and resolution lifecycle
          </p>
        </div>

        <button
          onClick={onDeclareIncident}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or service name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Severities</option>
              <option value="CRITICAL" className="bg-slate-900">Critical (P0)</option>
              <option value="HIGH" className="bg-slate-900">High (P1)</option>
              <option value="MEDIUM" className="bg-slate-900">Medium (P2)</option>
              <option value="LOW" className="bg-slate-900">Low (P3)</option>
            </select>
          </div>

          <button
            onClick={fetchIncidents}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colIncidents = incidents.filter((i) => i.status === col.status);
          const Icon = col.icon;
          return (
            <div
              key={col.status}
              className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col min-h-[450px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {col.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {colIncidents.length}
                </span>
              </div>

              {/* Incidents List in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {colIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => onSelectIncident(incident.id)}
                  />
                ))}

                {colIncidents.length === 0 && (
                  <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-slate-600 text-xs italic">
                    No incidents
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
