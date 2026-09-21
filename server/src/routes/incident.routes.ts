import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  addComment,
} from '../controllers/incident.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'MEMBER'), createIncident);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER', 'MEMBER'), updateIncident);
router.post('/:id/comments', authorizeRoles('ADMIN', 'MANAGER', 'MEMBER'), addComment);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteIncident);

export default router;
