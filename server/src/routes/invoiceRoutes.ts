import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  downloadInvoicePdf,
  sendInvoiceByEmail,
  cancelInvoice,
  applyCouponToInvoice,
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePdf);
router.post('/:id/send-email', sendInvoiceByEmail);
router.post('/:id/cancel', authorize('super_admin', 'staff'), cancelInvoice);
router.post('/:id/apply-coupon', applyCouponToInvoice);

export default router;
