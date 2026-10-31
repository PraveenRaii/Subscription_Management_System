import { Router } from 'express';
import { createCreditNote, getCreditNotes } from '../controllers/creditNoteController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);

router.get('/', getCreditNotes);
router.post('/', authorize('super_admin', 'staff'), createCreditNote);

export default router;
