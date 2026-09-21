import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.get('/dashboard', getDashboardAnalytics);

export default router;
