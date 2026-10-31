import { Router } from 'express';
import {
  getStaffMembers,
  updateStaffPermissions,
} from '../controllers/staffController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, authorize('super_admin'));

router.get('/', getStaffMembers);
router.put('/:id', updateStaffPermissions);

export default router;
