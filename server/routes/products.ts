import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '@prisma/client';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema,
  uuidParamSchema,
  slugParamSchema,
  categorySlugParamSchema,
  productIdParamSchema,
  variantIdParamSchema,
} from '../schemas/productSchemas';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * GET /api/products
 * Get paginated products with filters
 * Query params: page, limit, category, sort, search, minPrice, maxPrice
 */
router.get(
  '/',
  validateRequest(productQuerySchema, 'query'),
  productController.getAllProducts
);

/**
 * GET /api/products/slug/:slug
 * Get product by slug (SEO-friendly URLs)
 */
router.get(
  '/slug/:slug',
  validateRequest(slugParamSchema, 'params'),
  productController.getProductBySlug
);

/**
 * GET /api/products/category/:categorySlug
 * Get products by category slug
 * Supports same filtering as GET /api/products
 */
router.get(
  '/category/:categorySlug',
  validateRequest(categorySlugParamSchema, 'params'),
  validateRequest(productQuerySchema, 'query'),
  productController.getProductsByCategory
);

// ============================================
// VARIANT ROUTES (Must be before /:id route)
// ============================================

/**
 * GET /api/products/variants/low-stock
 * Get variants with low stock (< 5)
 * Admin or Inventory Manager only
 */
router.get(
  '/variants/low-stock',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER),
  productController.getLowStockVariants
);

/**
 * PUT /api/products/variants/:variantId
 * Update variant (Admin or Inventory Manager)
 */
router.put(
  '/variants/:variantId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER),
  validateRequest(variantIdParamSchema, 'params'),
  validateRequest(updateVariantSchema, 'body'),
  productController.updateVariant
);

/**
 * DELETE /api/products/variants/:variantId
 * Soft delete variant (Admin only)
 */
router.delete(
  '/variants/:variantId',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(variantIdParamSchema, 'params'),
  productController.deleteVariant
);

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get(
  '/:id',
  validateRequest(uuidParamSchema, 'params'),
  productController.getProductById
);

// ============================================
// PROTECTED ROUTES - ADMIN ONLY
// ============================================

/**
 * POST /api/products
 * Create new product (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(createProductSchema, 'body'),
  productController.createProduct
);

/**
 * PUT /api/products/:id
 * Update product (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(uuidParamSchema, 'params'),
  validateRequest(updateProductSchema, 'body'),
  productController.updateProduct
);

/**
 * DELETE /api/products/:id
 * Soft delete product (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(uuidParamSchema, 'params'),
  productController.deleteProduct
);

/**
 * POST /api/products/:productId/variants
 * Create product variant (Admin only)
 */
router.post(
  '/:productId/variants',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(productIdParamSchema, 'params'),
  validateRequest(createVariantSchema, 'body'),
  productController.createVariant
);

export default router;