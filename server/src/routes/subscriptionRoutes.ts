import { Router } from 'express';
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  previewProration,
  changePlan,
  cancelSubscription,
  addTeamMember,
  recordUsage,
  getSubscriptionTimeline,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getSubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/', createSubscription);
router.post('/:id/pause', pauseSubscription);
router.post('/:id/resume', resumeSubscription);
router.post('/:id/renew', renewSubscription);
router.post('/:id/preview-proration', previewProration);
router.post('/:id/change-plan', changePlan);
router.get('/:id/timeline', getSubscriptionTimeline);
router.post('/:id/cancel', cancelSubscription);
router.post('/:id/team-members', addTeamMember);
router.post('/:id/usage', recordUsage);

export default router;
