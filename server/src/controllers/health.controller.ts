import { Request, Response } from 'express';
import { prisma } from '../config';
import os from 'os';

export const getLiveness = (req: Request, res: Response): void => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
};

export const getReadiness = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'READY',
      services: {
        database: 'HEALTHY',
        server: 'HEALTHY',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'NOT_READY',
      services: {
        database: 'UNHEALTHY',
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getSystemTelemetry = (req: Request, res: Response): void => {
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = process.uptime();

  res.status(200).json({
    status: 'HEALTHY',
    system: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      freeMemoryBytes: os.freemem(),
      totalMemoryBytes: os.totalmem(),
    },
    process: {
      nodeVersion: process.version,
      pid: process.pid,
      uptimeSeconds: Math.floor(uptimeSeconds),
      memory: {
        rssMb: +(memoryUsage.rss / 1024 / 1024).toFixed(2),
        heapTotalMb: +(memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        heapUsedMb: +(memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
    },
    timestamp: new Date().toISOString(),
  });
};
