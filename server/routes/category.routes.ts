import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authenticate, authorize(UserRole.ADMIN), categoryController.createCategory);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), categoryController.deleteCategory);

export default router;
