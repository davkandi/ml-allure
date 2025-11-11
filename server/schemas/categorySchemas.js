import { z } from 'zod';

/**
 * ML Allure - Category Validation Schemas
 * French error messages for all validations
 */

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Le nom est requis' })
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  
  slug: z
    .string({ required_error: 'Le slug est requis' })
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(100, 'Le slug ne peut pas dépasser 100 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit être en minuscules avec des tirets uniquement'),
  
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
  
  imageUrl: z
    .string()
    .url('L\'URL de l\'image doit être valide')
    .optional()
    .nullable(),
  
  displayOrder: z
    .number({ required_error: 'L\'ordre d\'affichage est requis' })
    .int('L\'ordre d\'affichage doit être un nombre entier')
    .min(0, 'L\'ordre d\'affichage doit être positif')
    .default(0),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .optional(),
  
  slug: z
    .string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(100, 'Le slug ne peut pas dépasser 100 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit être en minuscules avec des tirets uniquement')
    .optional(),
  
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
  
  imageUrl: z
    .string()
    .url('L\'URL de l\'image doit être valide')
    .optional()
    .nullable(),
  
  displayOrder: z
    .number()
    .int('L\'ordre d\'affichage doit être un nombre entier')
    .min(0, 'L\'ordre d\'affichage doit être positif')
    .optional(),
  
  isActive: z
    .boolean()
    .optional(),
});

export const reorderCategoriesSchema = z.object({
  categories: z
    .array(
      z.object({
        id: z.number({ required_error: 'L\'ID de la catégorie est requis' }).int(),
        displayOrder: z.number({ required_error: 'L\'ordre d\'affichage est requis' }).int().min(0),
      })
    )
    .min(1, 'Au moins une catégorie doit être fournie'),
});
