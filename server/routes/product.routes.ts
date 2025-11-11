import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticate, authorize(UserRole.ADMIN), productController.createProduct);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), productController.updateProduct);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), productController.deleteProduct);

export default router;
