import { Router } from 'express';
import {
  getQuotations,
  createQuotation,
  updateQuotationStatus,
} from '../controllers/quotationController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);

router.get('/', getQuotations);
router.post('/', authorize('super_admin', 'staff'), createQuotation);
router.put('/:id/status', authorize('super_admin', 'staff'), updateQuotationStatus);

export default router;
