import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('super_admin', 'staff'), getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

export default router;
