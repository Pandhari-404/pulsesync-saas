import { Router } from 'express';
import { getWorkspaceMembers, updateUserRole, inviteMember } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', getWorkspaceMembers);
router.post('/invite', authorizeRoles('ADMIN', 'MANAGER'), inviteMember);
router.patch('/:id/role', authorizeRoles('ADMIN'), updateUserRole);

export default router;
