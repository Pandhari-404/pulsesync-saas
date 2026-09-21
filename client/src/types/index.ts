export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  avatarUrl?: string;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  message: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  serviceName: string;
  workspaceId: string;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  updates?: IncidentUpdate[];
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  creator?: {
    name: string;
    email: string;
  };
}

export interface AnalyticsData {
  summary: {
    totalIncidents: number;
    activeIncidents: number;
    mttrMinutes: number;
    teamMembersCount: number;
    apiKeysCount: number;
  };
  statusCounts: {
    INVESTIGATING: number;
    IDENTIFIED: number;
    MONITORING: number;
    RESOLVED: number;
  };
  severityCounts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  trends: Array<{
    date: string;
    day: string;
    reported: number;
    resolved: number;
  }>;
  serviceHealth: Array<{
    name: string;
    totalIncidents: number;
    openIncidents: number;
    status: 'OPERATIONAL' | 'DEGRADED' | 'MAJOR_OUTAGE';
    uptime: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    };
  }>;
}

export interface LiveTelemetry {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  latencyMs: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}
