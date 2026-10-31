import { Router } from 'express';
import {
  getRevenuePrediction,
  getChurnPrediction,
  getPlanRecommendation,
  chatWithBusinessAssistant,
  getFinancialInsights,
  getRetentionSuggestions,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);

router.get('/revenue-forecast', authorize('super_admin', 'staff'), getRevenuePrediction);
router.get('/churn-prediction', authorize('super_admin', 'staff'), getChurnPrediction);
router.get('/plan-recommendation', getPlanRecommendation);
router.post('/chat', chatWithBusinessAssistant);
router.get('/financial-insights', authorize('super_admin', 'staff'), getFinancialInsights);
router.get('/retention-suggestions', authorize('super_admin', 'staff'), getRetentionSuggestions);

export default router;
