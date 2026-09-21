import { Router } from 'express';
import { register, login, getMe, demoLogin } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/demo', demoLogin);
router.get('/me', authenticate, getMe);

export default router;
