import { Router } from 'express';
import { getLiveness, getReadiness, getSystemTelemetry } from '../controllers/health.controller';
import { register } from '../utils/metrics';

const router = Router();

// Kubernetes / container health probes
router.get('/live', getLiveness);
router.get('/ready', getReadiness);
router.get('/status', getReadiness);
router.get('/telemetry', getSystemTelemetry);

// Prometheus scraping endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex: any) {
    res.status(500).end(ex);
  }
});

export default router;
