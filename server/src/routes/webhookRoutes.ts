import { Router } from 'express';
import { handleRazorpayWebhook, getWebhookEvents } from '../controllers/webhookController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

// Public webhook endpoint for payment gateway
router.post('/razorpay', handleRazorpayWebhook);

// Admin inspection of webhook deliveries
router.get('/events', authenticate, authorize('super_admin'), getWebhookEvents);

export default router;
