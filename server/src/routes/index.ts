import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import planRoutes from './planRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import aiRoutes from './aiRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import quotationRoutes from './quotationRoutes.js';
import couponRoutes from './couponRoutes.js';
import customerRoutes from './customerRoutes.js';
import staffRoutes from './staffRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import { runBillingCycleNow } from '../services/billingScheduler.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/quotations', quotationRoutes);
router.use('/coupons', couponRoutes);
router.use('/customers', customerRoutes);
router.use('/staff', staffRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/webhooks', webhookRoutes);

// Manual trigger for recurring billing scheduler
router.post('/billing/run-cycle', authenticate, authorize('super_admin', 'staff'), async (req, res) => {
  try {
    const result = await runBillingCycleNow();
    res.json({
      success: true,
      message: 'Automated recurring billing cycle completed successfully.',
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
