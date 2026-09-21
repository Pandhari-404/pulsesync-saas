import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { lastEvent } = useSocket();
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'create' | 'update' | 'resolve';
  } | null>(null);

  useEffect(() => {
    if (!lastEvent) return;

    let toastData = null;
    if (lastEvent.type === 'incident:created') {
      toastData = {
        id: lastEvent.timestamp,
        title: 'New Incident Declared',
        message: `${lastEvent.data.title} (${lastEvent.data.severity})`,
        type: 'create' as const,
      };
    } else if (lastEvent.type === 'incident:updated') {
      const isResolved = lastEvent.data.status === 'RESOLVED';
      toastData = {
        id: lastEvent.timestamp,
        title: isResolved ? 'Incident Resolved' : 'Incident Status Updated',
        message: `${lastEvent.data.title} is now ${lastEvent.data.status}`,
        type: isResolved ? ('resolve' as const) : ('update' as const),
      };
    } else if (lastEvent.type === 'incident:comment') {
      toastData = {
        id: lastEvent.timestamp,
        title: 'Timeline Update Posted',
        message: lastEvent.data.update?.message || 'New communication published',
        type: 'update' as const,
      };
    }

    if (toastData) {
      setActiveToast(toastData);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'create':
        return <AlertTriangle className="h-5 w-5 text-rose-400" />;
      case 'resolve':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      default:
        return <Bell className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm w-full">
      <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-2xl shadow-indigo-950/50 flex items-start gap-3 backdrop-blur-md">
        <div className="p-2 rounded-xl bg-slate-800/80 shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              {activeToast.title}
            </h5>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-0.5 truncate font-medium">
            {activeToast.message}
          </p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Live real-time sync</span>
        </div>
      </div>
    </div>
  );
};
