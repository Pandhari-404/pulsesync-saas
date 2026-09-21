import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import incidentRoutes from './routes/incident.routes';
import analyticsRoutes from './routes/analytics.routes';
import userRoutes from './routes/user.routes';
import apiKeyRoutes from './routes/apiKey.routes';
import healthRoutes from './routes/health.routes';
import swaggerDocument from './docs/swagger.json';

export const createApp = (): Application => {
  const app = express();

  // Production security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permit Swagger UI asset loading
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? '*' : [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request telemetry and logging
  app.use(requestLogger);

  // Interactive Swagger UI API documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Health and observability routes
  app.use('/health', healthRoutes);

  // Core API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/keys', apiKeyRoutes);

  // Root welcome endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'PulseSync SaaS API',
      version: '1.0.0',
      status: 'OPERATIONAL',
      docs: '/api/docs',
      health: '/health/ready',
      metrics: '/health/metrics',
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
