import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', authorize('super_admin', 'staff'), getDashboardAnalytics);

export default router;
