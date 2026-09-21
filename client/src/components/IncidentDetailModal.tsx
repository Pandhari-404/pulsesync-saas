import React, { useState, useEffect } from 'react';
import { Incident, IncidentStatus } from '../types';
import { api } from '../api/client';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';

interface IncidentDetailModalProps {
  incidentId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incidentId,
  onClose,
  onUpdated,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [targetStatus, setTargetStatus] = useState<IncidentStatus>('INVESTIGATING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      const data = await api.incidents.getById(incidentId);
      setIncident(data);
      setTargetStatus(data.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  if (!incidentId) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !incident) return;

    try {
      setIsSubmitting(true);
      await api.incidents.addComment(incident.id, {
        status: targetStatus,
        message: commentText,
      });
      setCommentText('');
      await loadIncident();
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to add update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!incident) return;
    try {
      await api.incidents.update(incident.id, { status: newStatus });
      setTargetStatus(newStatus);
      await loadIncident();
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!incident || !window.confirm('Are you sure you want to delete this incident report?')) return;
    try {
      await api.incidents.delete(incident.id);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete incident');
    }
  };

  const statuses: IncidentStatus[] = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-indigo-300">
                {incident?.serviceName}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {incident?.createdAt && new Date(incident.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{incident?.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Delete incident"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Loading incident details...</span>
          </div>
        ) : incident ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Lifecycle Stage Switcher */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Lifecycle State
              </span>
              <div className="grid grid-cols-4 gap-2">
                {statuses.map((st) => {
                  const isCurrent = incident.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                        isCurrent
                          ? st === 'RESOLVED'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                            : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Incident Summary
              </h4>
              <p className="text-sm text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 whitespace-pre-wrap leading-relaxed">
                {incident.description}
              </p>
            </div>

            {/* Timeline / Communication Log */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Live Timeline & SRE Communication Log ({incident.updates?.length || 0})
              </h4>

              <div className="space-y-3 border-l-2 border-slate-800 ml-3 pl-4">
                {incident.updates && incident.updates.length > 0 ? (
                  incident.updates.map((update) => (
                    <div key={update.id} className="relative group">
                      <div className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">
                              {update.author?.name || 'SRE Team'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {update.status}
                            </span>
                          </div>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {new Date(update.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{update.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No timeline entries yet.</p>
                )}
              </div>
            </div>

            {/* Post Communication Update */}
            <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Post Live Status Update
                </span>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IncidentStatus)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      Status: {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Publish incident update to all responders and dashboard..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};
