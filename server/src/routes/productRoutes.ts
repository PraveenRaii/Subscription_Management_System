import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', authenticate, authorize('super_admin', 'staff'), createProduct);
router.put('/:id', authenticate, authorize('super_admin', 'staff'), updateProduct);
router.delete('/:id', authenticate, authorize('super_admin'), deleteProduct);

router.post('/:productId/variants', authenticate, authorize('super_admin', 'staff'), createProductVariant);

export default router;
