import {
  User,
  Workspace,
  Incident,
  AnalyticsData,
  ApiKey,
  LiveTelemetry,
  IncidentStatus,
  IncidentSeverity,
} from '../types';

export const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${BACKEND_URL}/api`;

export const getAuthToken = (): string | null => {
  return localStorage.getItem('pulsesync_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('pulsesync_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('pulsesync_token');
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearAuthToken();
      window.location.reload();
    }
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
};

export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const res = await fetchWithAuth(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (res.data?.token) setAuthToken(res.data.token);
      return res.data;
    },
    register: async (userData: { name: string; email: string; password: string; workspaceName?: string }) => {
      const res = await fetchWithAuth(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (res.data?.token) setAuthToken(res.data.token);
      return res.data;
    },
    demoLogin: async (role: 'ADMIN' | 'VIEWER' = 'ADMIN') => {
      const res = await fetchWithAuth(`${API_BASE}/auth/demo?role=${role}`);
      if (res.data?.token) setAuthToken(res.data.token);
      return res.data;
    },
    getMe: async (): Promise<User & { workspace: Workspace }> => {
      const res = await fetchWithAuth(`${API_BASE}/auth/me`);
      return res.data;
    },
    logout: () => {
      clearAuthToken();
    },
  },

  incidents: {
    list: async (params: { status?: string; severity?: string; search?: string } = {}): Promise<Incident[]> => {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.severity) query.set('severity', params.severity);
      if (params.search) query.set('search', params.search);

      const res = await fetchWithAuth(`${API_BASE}/incidents?${query.toString()}`);
      return res.data;
    },
    getById: async (id: string): Promise<Incident> => {
      const res = await fetchWithAuth(`${API_BASE}/incidents/${id}`);
      return res.data;
    },
    create: async (data: {
      title: string;
      description: string;
      severity: IncidentSeverity;
      serviceName: string;
      assigneeId?: string;
    }): Promise<Incident> => {
      const res = await fetchWithAuth(`${API_BASE}/incidents`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    update: async (id: string, data: Partial<Incident>): Promise<Incident> => {
      const res = await fetchWithAuth(`${API_BASE}/incidents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    addComment: async (id: string, data: { status: IncidentStatus; message: string }) => {
      const res = await fetchWithAuth(`${API_BASE}/incidents/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    delete: async (id: string) => {
      return await fetchWithAuth(`${API_BASE}/incidents/${id}`, {
        method: 'DELETE',
      });
    },
  },

  analytics: {
    getDashboard: async (): Promise<AnalyticsData> => {
      const res = await fetchWithAuth(`${API_BASE}/analytics/dashboard`);
      return res.data;
    },
  },

  users: {
    list: async (): Promise<User[]> => {
      const res = await fetchWithAuth(`${API_BASE}/users`);
      return res.data;
    },
    updateRole: async (id: string, role: string) => {
      const res = await fetchWithAuth(`${API_BASE}/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      return res.data;
    },
    invite: async (data: { name: string; email: string; role: string }) => {
      const res = await fetchWithAuth(`${API_BASE}/users/invite`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
  },

  keys: {
    list: async (): Promise<ApiKey[]> => {
      const res = await fetchWithAuth(`${API_BASE}/keys`);
      return res.data;
    },
    create: async (name: string): Promise<ApiKey & { apiKey: string }> => {
      const res = await fetchWithAuth(`${API_BASE}/keys`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return res.data;
    },
    revoke: async (id: string) => {
      return await fetchWithAuth(`${API_BASE}/keys/${id}`, {
        method: 'DELETE',
      });
    },
  },

  system: {
    getTelemetry: async (): Promise<any> => {
      const res = await fetchWithAuth(`${BACKEND_URL}/health/telemetry`);
      return res;
    },
    getHealth: async (): Promise<any> => {
      const res = await fetchWithAuth(`${BACKEND_URL}/health/ready`);
      return res;
    },
  },
};
