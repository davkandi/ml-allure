import { eq, and, sql, count } from 'drizzle-orm';
import { database } from '../config/database';
import { categories, products } from '../../src/db/schema';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from '../schemas/categorySchemas';

/**
 * GET /api/categories (Public)
 * Return all active categories with product count, sorted by displayOrder
 */
export const getAllCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const isAdmin = req.user?.role === 'ADMIN';

    // Build query condition - show inactive only for admins
    const shouldIncludeInactive = includeInactive === 'true' && isAdmin;

    // Get all categories
    const allCategories = await database
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(shouldIncludeInactive ? undefined : eq(categories.isActive, true))
      .orderBy(categories.displayOrder);

    // Get product counts for each category
    const categoriesWithCount = await Promise.all(
      allCategories.map(async (category) => {
        const [productCount] = await database
          .select({ count: count() })
          .from(products)
          .where(
            and(
              eq(products.categoryId, category.id),
              eq(products.isActive, true)
            )
          );

        return {
          ...category,
          productCount: productCount.count || 0,
        };
      })
    );

    res.json({
      success: true,
      categories: categoriesWithCount,
      total: categoriesWithCount.length,
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
    });
  }
};

/**
 * GET /api/categories/:id (Public)
 * Return single category with products
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN';

    // Get category
    const [category] = await database
      .select()
      .from(categories)
      .where(eq(categories.id, parseInt(id)))
      .limit(1);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }

    // Check if category is inactive and user is not admin
    if (!category.isActive && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }

    // Get products in this category
    const categoryProducts = await database
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, category.id),
          isAdmin ? undefined : eq(products.isActive, true)
        )
      )
      .orderBy(products.name);

    res.json({
      success: true,
      category: {
        ...category,
        products: categoryProducts,
      },
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
    });
  }
};

/**
 * POST /api/categories (Protected: Admin only)
 * Create new category with unique slug validation
 */
export const createCategory = async (req, res) => {
  try {
    // Validate request body
    const validatedData = createCategorySchema.parse(req.body);

    // Check if slug already exists
    const [existingCategory] = await database
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie avec ce slug existe déjà',
      });
    }

    // Create category
    const timestamp = Date.now();
    const [newCategory] = await database
      .insert(categories)
      .values({
        ...validatedData,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      category: newCategory,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }

    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
    });
  }
};

/**
 * PUT /api/categories/:id (Protected: Admin only)
 * Update category
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = updateCategorySchema.parse(req.body);

    // Check if category exists
    const [existingCategory] = await database
      .select()
      .from(categories)
      .where(eq(categories.id, parseInt(id)))
      .limit(1);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }

    // If slug is being updated, check uniqueness
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const [slugExists] = await database
        .select()
        .from(categories)
        .where(eq(categories.slug, validatedData.slug))
        .limit(1);

      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'Une catégorie avec ce slug existe déjà',
        });
      }
    }

    // Update category
    const [updatedCategory] = await database
      .update(categories)
      .set({
        ...validatedData,
        updatedAt: Date.now(),
      })
      .where(eq(categories.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      category: updatedCategory,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }

    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie',
    });
  }
};

/**
 * DELETE /api/categories/:id (Protected: Admin only)
 * Soft delete - set isActive to false
 * Don't delete if category has products
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [category] = await database
      .select()
      .from(categories)
      .where(eq(categories.id, parseInt(id)))
      .limit(1);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }

    // Check if category has products
    const [productCount] = await database
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, parseInt(id)));

    if (productCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette catégorie car elle contient ${productCount.count} produit(s)`,
      });
    }

    // Soft delete - set isActive to false
    await database
      .update(categories)
      .set({
        isActive: false,
        updatedAt: Date.now(),
      })
      .where(eq(categories.id, parseInt(id)));

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
    });
  }
};

/**
 * PUT /api/categories/reorder (Protected: Admin only)
 * Update displayOrder for multiple categories
 */
export const reorderCategories = async (req, res) => {
  try {
    // Validate request body
    const validatedData = reorderCategoriesSchema.parse(req.body);

    // Update each category's displayOrder
    const updatePromises = validatedData.categories.map((item) =>
      database
        .update(categories)
        .set({
          displayOrder: item.displayOrder,
          updatedAt: Date.now(),
        })
        .where(eq(categories.id, item.id))
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Ordre des catégories mis à jour avec succès',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }

    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réorganisation des catégories',
    });
  }
};
