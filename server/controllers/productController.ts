import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { generateSKU } from '../utils/generateSKU';
import { Prisma } from '@prisma/client';

/**
 * Helper function to generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * GET /api/products (Public)
 * Get paginated products with filters
 */
export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      sort = 'newest',
      search,
      minPrice,
      maxPrice,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    // Only show active products for non-admin users
    if (!req.user || req.user.role !== 'ADMIN') {
      where.isActive = true;
    }

    // Category filter
    if (category) {
      where.category = {
        slug: category as string,
      };
    }

    // Search in name and description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Price filters
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) {
        where.basePrice.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        where.basePrice.lte = parseFloat(maxPrice as string);
      }
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'price_desc':
        orderBy = { basePrice: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            colorHex: true,
            stockQuantity: true,
            additionalPrice: true,
          },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        pages: totalPages,
        limit: limitNum,
      },
      filters: {
        category,
        sort,
        search,
        minPrice,
        maxPrice,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits',
    });
  }
};

/**
 * GET /api/products/:id (Public)
 * Get single product by ID
 */
export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const where: Prisma.ProductWhereUniqueInput = { id };

    const product = await prisma.product.findUnique({
      where,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: [
            { size: 'asc' },
            { color: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    // Check if product is active for non-admin users
    if (!product.isActive && (!req.user || req.user.role !== 'ADMIN')) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    res.json({ product });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du produit',
    });
  }
};

/**
 * GET /api/products/slug/:slug (Public)
 * Get single product by slug
 */
export const getProductBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: [
            { size: 'asc' },
            { color: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    // Check if product is active for non-admin users
    if (!product.isActive && (!req.user || req.user.role !== 'ADMIN')) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    res.json({ product });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du produit',
    });
  }
};

/**
 * GET /api/products/category/:categorySlug (Public)
 * Get products by category slug
 */
export const getProductsByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { categorySlug } = req.params;
    const {
      page = 1,
      limit = 20,
      sort = 'newest',
      search,
      minPrice,
      maxPrice,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      category: {
        slug: categorySlug,
      },
    };

    // Only show active products for non-admin users
    if (!req.user || req.user.role !== 'ADMIN') {
      where.isActive = true;
    }

    // Search in name and description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Price filters
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) {
        where.basePrice.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        where.basePrice.lte = parseFloat(maxPrice as string);
      }
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'price_desc':
        orderBy = { basePrice: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            colorHex: true,
            stockQuantity: true,
            additionalPrice: true,
          },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        pages: totalPages,
        limit: limitNum,
      },
      filters: {
        category: categorySlug,
        sort,
        search,
        minPrice,
        maxPrice,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits de la catégorie',
    });
  }
};

/**
 * POST /api/products (Protected: Admin only)
 * Create new product
 */
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      categoryId,
      basePrice,
      images = [],
      tags = [],
      isFeatured = false,
    } = req.body;

    // Generate slug from name
    const slug = generateSlug(name);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return res.status(400).json({
        message: 'Un produit avec ce nom existe déjà',
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        message: 'Catégorie non trouvée',
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        basePrice,
        images,
        tags,
        isFeatured,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      product,
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du produit',
    });
  }
};

/**
 * PUT /api/products/:id (Protected: Admin only)
 * Update product
 */
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    // If name is being updated, generate new slug
    if (updateData.name && updateData.name !== existingProduct.name) {
      const newSlug = generateSlug(updateData.name);
      
      // Check if new slug conflicts with another product
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return res.status(400).json({
          message: 'Un produit avec ce nom existe déjà',
        });
      }

      updateData.slug = newSlug;
    }

    // If categoryId is being updated, verify it exists
    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!category) {
        return res.status(404).json({
          message: 'Catégorie non trouvée',
        });
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
        },
      },
    });

    res.json({
      message: 'Produit mis à jour avec succès',
      product,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du produit',
    });
  }
};

/**
 * DELETE /api/products/:id (Protected: Admin only)
 * Soft delete product (set isActive to false)
 */
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    // Check if product has pending orders
    const pendingOrders = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'PROCESSING'],
          },
        },
      },
    });

    if (pendingOrders) {
      return res.status(400).json({
        message: 'Impossible de supprimer le produit car il a des commandes en cours',
      });
    }

    // Soft delete product
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Produit supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du produit',
    });
  }
};

/**
 * POST /api/products/:productId/variants (Protected: Admin only)
 * Create product variant
 */
export const createVariant = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const {
      size,
      color,
      colorHex,
      stockQuantity,
      additionalPrice = 0,
    } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        message: 'Produit non trouvé',
      });
    }

    // Generate SKU
    const sku = generateSKU(productId, size, color);

    // Check if SKU already exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { sku },
    });

    if (existingVariant) {
      return res.status(400).json({
        message: 'Une variante avec cette combinaison taille/couleur existe déjà',
      });
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        size,
        color,
        colorHex,
        stockQuantity,
        additionalPrice,
        isActive: true,
      },
    });

    // Create inventory log for RESTOCK
    if (stockQuantity > 0 && req.user) {
      await prisma.inventoryLog.create({
        data: {
          variantId: variant.id,
          changeType: 'RESTOCK',
          quantityChange: stockQuantity,
          previousQuantity: 0,
          newQuantity: stockQuantity,
          reason: 'Stock initial lors de la création de la variante',
          performedBy: req.user.id,
        },
      });
    }

    res.status(201).json({
      message: 'Variante créée avec succès',
      variant,
    });
  } catch (error) {
    console.error('Erreur lors de la création de la variante:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la variante',
    });
  }
};

/**
 * PUT /api/variants/:variantId (Protected: Admin/Inventory Manager)
 * Update variant
 */
export const updateVariant = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const updateData = req.body;

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!existingVariant) {
      return res.status(404).json({
        message: 'Variante non trouvée',
      });
    }

    // If size or color is being updated, regenerate SKU
    if (updateData.size || updateData.color) {
      const newSize = updateData.size || existingVariant.size;
      const newColor = updateData.color || existingVariant.color;
      const newSku = generateSKU(existingVariant.productId, newSize, newColor);

      // Check if new SKU conflicts with another variant
      if (newSku !== existingVariant.sku) {
        const skuConflict = await prisma.productVariant.findFirst({
          where: {
            sku: newSku,
            id: { not: variantId },
          },
        });

        if (skuConflict) {
          return res.status(400).json({
            message: 'Une variante avec cette combinaison taille/couleur existe déjà',
          });
        }

        updateData.sku = newSku;
      }
    }

    // If stockQuantity changes, create inventory log
    if (updateData.stockQuantity !== undefined && updateData.stockQuantity !== existingVariant.stockQuantity && req.user) {
      const quantityChange = updateData.stockQuantity - existingVariant.stockQuantity;
      const changeType = quantityChange > 0 ? 'RESTOCK' : 'ADJUSTMENT';

      await prisma.inventoryLog.create({
        data: {
          variantId,
          changeType,
          quantityChange,
          previousQuantity: existingVariant.stockQuantity,
          newQuantity: updateData.stockQuantity,
          reason: 'Mise à jour manuelle du stock',
          performedBy: req.user.id,
        },
      });
    }

    // Update variant
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      message: 'Variante mise à jour avec succès',
      variant,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la variante:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la variante',
    });
  }
};

/**
 * DELETE /api/variants/:variantId (Protected: Admin only)
 * Soft delete variant
 */
export const deleteVariant = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return res.status(404).json({
        message: 'Variante non trouvée',
      });
    }

    // Check if variant has pending orders
    const pendingOrders = await prisma.orderItem.findFirst({
      where: {
        variantId,
        order: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'PROCESSING'],
          },
        },
      },
    });

    if (pendingOrders) {
      return res.status(400).json({
        message: 'Impossible de supprimer la variante car elle a des commandes en cours',
      });
    }

    // Soft delete variant
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });

    res.json({
      message: 'Variante supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la variante:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la variante',
    });
  }
};

/**
 * GET /api/variants/low-stock (Protected: Admin/Inventory Manager)
 * Get variants with low stock (< 5)
 */
export const getLowStockVariants = async (req: AuthRequest, res: Response) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        stockQuantity: {
          lt: 5,
        },
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    res.json({
      variants,
      count: variants.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des variantes en rupture de stock:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des variantes en rupture de stock',
    });
  }
};
