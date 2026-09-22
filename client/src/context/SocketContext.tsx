import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { LiveTelemetry } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  liveTelemetry: LiveTelemetry | null;
  lastEvent: { type: string; data: any; timestamp: string } | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { workspace } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTelemetry | null>(null);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any; timestamp: string } | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (workspace?.id) {
        socketInstance.emit('join:workspace', workspace.id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('telemetry:tick', (data: LiveTelemetry) => {
      setLiveTelemetry(data);
    });

    // Real-time event listeners
    const handleIncidentCreated = (data: any) => {
      setLastEvent({ type: 'incident:created', data, timestamp: new Date().toISOString() });
    };

    const handleIncidentUpdated = (data: any) => {
      setLastEvent({ type: 'incident:updated', data, timestamp: new Date().toISOString() });
    };

    const handleIncidentDeleted = (data: any) => {
      setLastEvent({ type: 'incident:deleted', data, timestamp: new Date().toISOString() });
    };

    const handleIncidentComment = (data: any) => {
      setLastEvent({ type: 'incident:comment', data, timestamp: new Date().toISOString() });
    };

    socketInstance.on('incident:created', handleIncidentCreated);
    socketInstance.on('incident:updated', handleIncidentUpdated);
    socketInstance.on('incident:deleted', handleIncidentDeleted);
    socketInstance.on('incident:comment', handleIncidentComment);

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [workspace?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveTelemetry,
        lastEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
