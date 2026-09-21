import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { TeamPage } from './pages/TeamPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { CreateIncidentModal } from './components/CreateIncidentModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { ToastNotification } from './components/ToastNotification';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading PulseSync SaaS...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onDeclareIncident={() => setIsCreateOpen(true)}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              onNavigateToIncidents={() => setActiveTab('incidents')}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsPage
              onDeclareIncident={() => setIsCreateOpen(true)}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'monitoring' && <MonitoringPage />}

          {activeTab === 'team' && <TeamPage />}

          {activeTab === 'api-keys' && <ApiKeysPage />}
        </main>
      </div>

      {/* Global Modals */}
      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {}}
      />

      <IncidentDetailModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
        onUpdated={() => {}}
      />

      {/* Real-Time Live Sync Toast Notification */}
      <ToastNotification />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
