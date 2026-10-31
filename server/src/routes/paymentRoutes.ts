import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  processRefund,
  getPayments,
  retryFailedPayment,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/', getPayments);
router.post('/refund', authorize('super_admin', 'staff'), processRefund);
router.post('/:id/retry', authorize('super_admin', 'staff'), retryFailedPayment);

export default router;
