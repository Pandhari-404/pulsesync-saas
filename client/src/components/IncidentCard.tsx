import React from 'react';
import { Incident, IncidentStatus, IncidentSeverity } from '../types';
import { AlertCircle, Clock, CheckCircle2, Eye, Server, MessageSquare } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
  onStatusChange?: (id: string, newStatus: IncidentStatus) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick, onStatusChange }) => {
  const getSeverityStyle = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/10';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case 'INVESTIGATING':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />;
      case 'IDENTIFIED':
        return <Eye className="h-3.5 w-3.5 text-amber-400" />;
      case 'MONITORING':
        return <Clock className="h-3.5 w-3.5 text-yellow-400" />;
      case 'RESOLVED':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-sm hover:shadow-md space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSeverityStyle(
            incident.severity
          )}`}
        >
          {incident.severity}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="h-3 w-3" />
          <span>{timeAgo(incident.createdAt)}</span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-100 text-sm group-hover:text-indigo-300 transition-colors line-clamp-1">
          {incident.title}
        </h4>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {incident.description}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/40">
          <Server className="h-3 w-3 text-indigo-400" />
          <span className="font-mono text-[11px]">{incident.serviceName}</span>
        </div>

        <div className="flex items-center gap-2">
          {incident.updates && incident.updates.length > 0 && (
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <MessageSquare className="h-3 w-3" />
              <span>{incident.updates.length}</span>
            </div>
          )}

          {incident.assignee ? (
            <div
              className="h-6 w-6 rounded-full bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-[10px] font-bold text-white"
              title={`Assigned to ${incident.assignee.name}`}
            >
              {incident.assignee.name.charAt(0)}
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};
