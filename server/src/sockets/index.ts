import { Server as SocketIOServer, Socket } from 'socket.io';
import { activeWebsocketConnectionsGauge } from '../utils/metrics';
import { logger } from '../utils/logger';

let ioInstance: SocketIOServer | null = null;
let activeConnectionsCount = 0;

export const initSocketIO = (io: SocketIOServer) => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    activeConnectionsCount++;
    activeWebsocketConnectionsGauge.set(activeConnectionsCount);
    logger.info(`Socket connected: ${socket.id} (total active: ${activeConnectionsCount})`);

    // Join workspace-specific room for multi-tenant isolation
    socket.on('join:workspace', (workspaceId: string) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        logger.info(`Socket ${socket.id} joined room workspace:${workspaceId}`);
      }
    });

    // Leave workspace room
    socket.on('leave:workspace', (workspaceId: string) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
        logger.info(`Socket ${socket.id} left room workspace:${workspaceId}`);
      }
    });

    // Broadcast user presence / typing activity
    socket.on('typing:start', (data: { workspaceId: string; user: string; incidentId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('typing:status', {
        ...data,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data: { workspaceId: string; user: string; incidentId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('typing:status', {
        ...data,
        isTyping: false,
      });
    });

    socket.on('disconnect', () => {
      activeConnectionsCount = Math.max(0, activeConnectionsCount - 1);
      activeWebsocketConnectionsGauge.set(activeConnectionsCount);
      logger.info(`Socket disconnected: ${socket.id} (total active: ${activeConnectionsCount})`);
    });
  });

  // Simulated live telemetry push every 5 seconds for real-time monitoring
  setInterval(() => {
    if (ioInstance) {
      const liveMetrics = {
        timestamp: new Date().toISOString(),
        cpuUsage: +(Math.random() * 15 + 10).toFixed(1), // 10% - 25%
        memoryUsage: +(Math.random() * 10 + 40).toFixed(1), // 40% - 50%
        activeConnections: activeConnectionsCount,
        latencyMs: +(Math.random() * 20 + 5).toFixed(1),
        status: 'HEALTHY',
      };
      ioInstance.emit('telemetry:tick', liveMetrics);
    }
  }, 5000);
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized yet');
  }
  return ioInstance;
};

export const emitToWorkspace = (workspaceId: string, event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to(`workspace:${workspaceId}`).emit(event, payload);
    // Also emit globally for dashboards monitoring all events
    ioInstance.emit(`global:${event}`, payload);
  }
};
