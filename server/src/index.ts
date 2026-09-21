import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config, prisma } from './config';
import { initSocketIO } from './sockets';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

// Initialize WebSockets with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin === '*' ? '*' : [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

initSocketIO(io);

// Start server
server.listen(config.port, () => {
  logger.info(`========================================================`);
  logger.info(`🚀 PulseSync SaaS API running in [${config.nodeEnv}] mode`);
  logger.info(`🌐 Listening on http://localhost:${config.port}`);
  logger.info(`📚 Swagger Documentation at http://localhost:${config.port}/api/docs`);
  logger.info(`📈 Prometheus Metrics at http://localhost:${config.port}/health/metrics`);
  logger.info(`🏥 Health Check at http://localhost:${config.port}/health/ready`);
  logger.info(`========================================================`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    process.exit(0);
  });

  // Force close after 10s if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
