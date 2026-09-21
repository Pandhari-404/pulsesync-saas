import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { api, getAuthToken, clearAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; workspaceName?: string }) => Promise<void>;
  demoLogin: (role?: 'ADMIN' | 'VIEWER') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt,
      });
      setWorkspace(data.workspace);
    } catch (err) {
      clearAuthToken();
      setUser(null);
      setWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await api.auth.login(credentials);
      setUser(data.user);
      setWorkspace(data.workspace);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; workspaceName?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      setUser(res.user);
      setWorkspace(res.workspace);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'ADMIN' | 'VIEWER' = 'ADMIN') => {
    setIsLoading(true);
    try {
      const res = await api.auth.demoLogin(role);
      setUser(res.user);
      setWorkspace(res.workspace);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
