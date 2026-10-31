import { Router } from 'express';
import {
  getCoupons,
  createCoupon,
  validateCoupon,
  toggleCouponStatus,
} from '../controllers/couponController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.post('/validate', validateCoupon);

router.use(authenticate);

router.get('/', getCoupons);
router.post('/', authorize('super_admin', 'staff'), createCoupon);
router.put('/:id/toggle', authorize('super_admin', 'staff'), toggleCouponStatus);

export default router;
