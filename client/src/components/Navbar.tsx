import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Activity, LogOut, Shield, Wifi, WifiOff, Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, workspace, logout } = useAuth();
  const { isConnected } = useSocket();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'MEMBER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Workspace */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            PulseSync
          </span>
        </div>

        {workspace && (
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
            <span className="text-slate-400">Workspace:</span>
            <span className="font-semibold text-slate-200 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
              {workspace.name}
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
              {workspace.plan}
            </span>
          </div>
        )}
      </div>

      {/* Right controls: WebSocket status, User Profile, Logout */}
      <div className="flex items-center gap-4">
        {/* Real-time sync badge */}
        <div
          className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
              : 'bg-rose-950/40 border-rose-800/50 text-rose-400'
          }`}
          title={isConnected ? 'Connected to real-time WebSocket cluster' : 'Reconnecting to real-time sync...'}
        >
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE SYNC</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>OFFLINE</span>
            </>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{user.name}</span>
              <div className="flex items-center justify-end gap-1.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getRoleBadge(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
