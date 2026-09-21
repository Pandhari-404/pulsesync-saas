import { Request, Response, NextFunction } from 'express';
import { httpRequestCounter, httpRequestDurationHistogram } from '../utils/metrics';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const durationInSeconds = elapsedHrTime[0] + elapsedHrTime[1] / 1e9;
    const durationInMs = Math.round(durationInSeconds * 1000);

    const route = req.baseUrl ? `${req.baseUrl}${req.route?.path || req.path}` : req.path;
    const statusCode = res.statusCode.toString();

    // Prometheus telemetry
    httpRequestCounter.inc({
      method: req.method,
      route: route || 'unknown',
      status_code: statusCode,
    });

    httpRequestDurationHistogram.observe(
      {
        method: req.method,
        route: route || 'unknown',
        status_code: statusCode,
      },
      durationInSeconds
    );

    // Filter out noisy health checks from verbose logging
    if (!req.path.startsWith('/health') && !req.path.startsWith('/metrics')) {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationInMs}ms`, {
        ip: req.ip,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};
