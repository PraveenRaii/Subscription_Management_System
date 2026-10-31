import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, authorize('super_admin'));
router.get('/', getAuditLogs);

export default router;
