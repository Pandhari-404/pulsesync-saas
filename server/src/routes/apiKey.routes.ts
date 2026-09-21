import { Router } from 'express';
import { getApiKeys, createApiKey, revokeApiKey } from '../controllers/apiKey.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getApiKeys);
router.post('/', authorizeRoles('ADMIN'), createApiKey);
router.delete('/:id', authorizeRoles('ADMIN'), revokeApiKey);

export default router;
