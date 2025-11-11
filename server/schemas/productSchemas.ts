import { z } from 'zod';

/**
 * Product Validation Schemas with French Error Messages
 */

// Create Product Schema
export const createProductSchema = z.object({
  name: z.string()
    .min(3, 'Le nom du produit doit contenir au moins 3 caractères')
    .max(200, 'Le nom du produit ne peut pas dépasser 200 caractères'),
  
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional(),
  
  categoryId: z.string()
    .uuid('L\'ID de catégorie doit être un UUID valide'),
  
  basePrice: z.number()
    .positive('Le prix de base doit être positif')
    .max(1000000, 'Le prix de base ne peut pas dépasser 1 000 000'),
  
  images: z.array(z.string().url('Chaque image doit être une URL valide'))
    .min(1, 'Au moins une image est requise')
    .max(10, 'Maximum 10 images autorisées')
    .optional(),
  
  tags: z.array(z.string())
    .max(20, 'Maximum 20 tags autorisés')
    .optional(),
  
  isFeatured: z.boolean().optional(),
});

// Update Product Schema (all fields optional)
export const updateProductSchema = z.object({
  name: z.string()
    .min(3, 'Le nom du produit doit contenir au moins 3 caractères')
    .max(200, 'Le nom du produit ne peut pas dépasser 200 caractères')
    .optional(),
  
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional(),
  
  categoryId: z.string()
    .uuid('L\'ID de catégorie doit être un UUID valide')
    .optional(),
  
  basePrice: z.number()
    .positive('Le prix de base doit être positif')
    .max(1000000, 'Le prix de base ne peut pas dépasser 1 000 000')
    .optional(),
  
  images: z.array(z.string().url('Chaque image doit être une URL valide'))
    .min(1, 'Au moins une image est requise')
    .max(10, 'Maximum 10 images autorisées')
    .optional(),
  
  tags: z.array(z.string())
    .max(20, 'Maximum 20 tags autorisés')
    .optional(),
  
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Create Product Variant Schema
export const createVariantSchema = z.object({
  size: z.string()
    .min(1, 'La taille est requise')
    .max(10, 'La taille ne peut pas dépasser 10 caractères'),
  
  color: z.string()
    .min(2, 'La couleur doit contenir au moins 2 caractères')
    .max(50, 'La couleur ne peut pas dépasser 50 caractères'),
  
  colorHex: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Le code couleur doit être au format hexadécimal (#RRGGBB)'),
  
  stockQuantity: z.number()
    .int('La quantité en stock doit être un entier')
    .min(0, 'La quantité en stock ne peut pas être négative')
    .max(100000, 'La quantité en stock ne peut pas dépasser 100 000'),
  
  additionalPrice: z.number()
    .min(0, 'Le prix additionnel ne peut pas être négatif')
    .max(100000, 'Le prix additionnel ne peut pas dépasser 100 000')
    .optional()
    .default(0),
});

// Update Variant Schema
export const updateVariantSchema = z.object({
  size: z.string()
    .min(1, 'La taille est requise')
    .max(10, 'La taille ne peut pas dépasser 10 caractères')
    .optional(),
  
  color: z.string()
    .min(2, 'La couleur doit contenir au moins 2 caractères')
    .max(50, 'La couleur ne peut pas dépasser 50 caractères')
    .optional(),
  
  colorHex: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Le code couleur doit être au format hexadécimal (#RRGGBB)')
    .optional(),
  
  stockQuantity: z.number()
    .int('La quantité en stock doit être un entier')
    .min(0, 'La quantité en stock ne peut pas être négative')
    .max(100000, 'La quantité en stock ne peut pas dépasser 100 000')
    .optional(),
  
  additionalPrice: z.number()
    .min(0, 'Le prix additionnel ne peut pas être négatif')
    .max(100000, 'Le prix additionnel ne peut pas dépasser 100 000')
    .optional(),
  
  isActive: z.boolean().optional(),
});

// Query Parameters Schema for Product List
export const productQuerySchema = z.object({
  page: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Le numéro de page doit être supérieur à 0')
    .optional()
    .default('1'),
  
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'La limite doit être entre 1 et 100')
    .optional()
    .default('20'),
  
  category: z.string().optional(),
  
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name'], {
    errorMap: () => ({ message: 'Le tri doit être: newest, price_asc, price_desc, ou name' })
  }).optional().default('newest'),
  
  search: z.string().max(200, 'La recherche ne peut pas dépasser 200 caractères').optional(),
  
  minPrice: z.string()
    .transform(val => parseFloat(val))
    .refine(val => val >= 0, 'Le prix minimum ne peut pas être négatif')
    .optional(),
  
  maxPrice: z.string()
    .transform(val => parseFloat(val))
    .refine(val => val >= 0, 'Le prix maximum ne peut pas être négatif')
    .optional(),
});

// UUID Parameter Schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('L\'ID doit être un UUID valide'),
});

// Slug Parameter Schema
export const slugParamSchema = z.object({
  slug: z.string()
    .min(1, 'Le slug est requis')
    .max(200, 'Le slug ne peut pas dépasser 200 caractères'),
});

// Category Slug Parameter Schema
export const categorySlugParamSchema = z.object({
  categorySlug: z.string()
    .min(1, 'Le slug de catégorie est requis')
    .max(200, 'Le slug de catégorie ne peut pas dépasser 200 caractères'),
});

// Product ID Parameter Schema
export const productIdParamSchema = z.object({
  productId: z.string().uuid('L\'ID du produit doit être un UUID valide'),
});

// Variant ID Parameter Schema
export const variantIdParamSchema = z.object({
  variantId: z.string().uuid('L\'ID de la variante doit être un UUID valide'),
});

// Type exports for TypeScript
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
