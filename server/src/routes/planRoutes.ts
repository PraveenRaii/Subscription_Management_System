import { Router } from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/planController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', getPlans);
router.get('/:id', getPlanById);

router.post('/', authenticate, authorize('super_admin', 'staff'), createPlan);
router.put('/:id', authenticate, authorize('super_admin', 'staff'), updatePlan);
router.delete('/:id', authenticate, authorize('super_admin'), deletePlan);

export default router;
