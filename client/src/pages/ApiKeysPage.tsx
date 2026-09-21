import React, { useState, useEffect } from 'react';
import { ApiKey } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Key, Plus, Copy, Check, Trash2, Shield, Terminal, Loader2, X } from 'lucide-react';

export const ApiKeysPage: React.FC = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await api.keys.list();
      setKeys(data);
    } catch (err) {
      console.error('Failed to load API keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const data = await api.keys.create(keyName);
      setNewKeyRevealed(data.apiKey);
      setKeyName('');
      fetchKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action is irreversible.')) return;
    try {
      await api.keys.revoke(id);
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke key');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">API Keys & Automation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically signed tokens for CI/CD pipelines, Prometheus, and external webhooks
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setNewKeyRevealed(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New API Key</span>
          </button>
        )}
      </div>

      {/* New Key Revealed Modal / Banner */}
      {newKeyRevealed && (
        <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-400" />
              API Key Generated Successfully
            </span>
            <span className="text-[11px] text-amber-300 font-semibold">
              Warning: This key will not be shown again.
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <code className="font-mono text-xs text-emerald-400 flex-1 select-all break-all">
              {newKeyRevealed}
            </code>
            <button
              onClick={() => handleCopy(newKeyRevealed)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Key Prefix</th>
                <th className="py-3.5 px-6">Created</th>
                <th className="py-3.5 px-6">Status</th>
                {user?.role === 'ADMIN' && <th className="py-3.5 px-6 text-right">Revoke</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-200">{k.name}</td>
                  <td className="py-4 px-6 font-mono text-xs text-indigo-300">{k.prefix}</td>
                  <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    {k.revokedAt ? (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-400 border border-rose-800/40">
                        REVOKED
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  {user?.role === 'ADMIN' && (
                    <td className="py-4 px-6 text-right">
                      {!k.revokedAt && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Revoke API Key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Integration Snippet */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span>Programmatic Usage (cURL Example)</span>
        </div>
        <p className="text-xs text-slate-400">
          Use the <code className="text-indigo-300">X-API-Key</code> header to automate incident creation in GitHub Actions, Datadog webhooks, or alertmanagers:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto select-all">
          curl -X POST {window.location.origin}/api/incidents \<br />
          &nbsp;&nbsp;-H &quot;X-API-Key: psk_live_demo1234567890abcdef12345678&quot; \<br />
          &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
          &nbsp;&nbsp;-d &apos;&#123;&quot;title&quot;:&quot;Deployment Health Check Failed&quot;,&quot;severity&quot;:&quot;HIGH&quot;,&quot;serviceName&quot;:&quot;Core API&quot;,&quot;description&quot;:&quot;Automated pipeline failure&quot;&#125;&apos;
        </div>
      </div>

      {/* Create Key Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Generate API Key</h3>
            <p className="text-xs text-slate-400 mb-4">
              Name your key to identify its calling client (e.g. GitHub Actions, Datadog)
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Key Name
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. GitHub Actions CI Deploy"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
