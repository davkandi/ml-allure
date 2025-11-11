import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers/categoryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.ts';

const router = Router();

/**
 * ML Allure - Category Management Routes
 */

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected routes - Admin only
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createCategory);
router.put('/reorder', authenticateToken, authorizeRoles('ADMIN'), reorderCategories);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateCategory);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteCategory);

export default router;