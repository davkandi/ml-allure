import { z } from 'zod';
import { PaymentMethod, DeliveryMethod } from '@prisma/client';

/**
 * Order Validation Schemas with French Error Messages
 */

// Congo phone number validation (supports +243 format)
const congoPhoneRegex = /^(\+243|0)?[0-9]{9}$/;

// Order item schema
export const orderItemSchema = z.object({
  variantId: z.string()
    .uuid('L\'ID de la variante doit être un UUID valide'),
  
  quantity: z.number()
    .int('La quantité doit être un entier')
    .min(1, 'La quantité doit être au moins 1')
    .max(100, 'La quantité ne peut pas dépasser 100'),
});

// Delivery address schema
export const deliveryAddressSchema = z.object({
  fullAddress: z.string()
    .min(10, 'L\'adresse complète doit contenir au moins 10 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères'),
  
  zone: z.string()
    .min(2, 'La commune/zone est requise')
    .max(100, 'La commune/zone ne peut pas dépasser 100 caractères'),
  
  instructions: z.string()
    .max(500, 'Les instructions ne peuvent pas dépasser 500 caractères')
    .optional(),
});

// Guest customer info schema
export const guestCustomerSchema = z.object({
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  
  phone: z.string()
    .regex(congoPhoneRegex, 'Numéro de téléphone invalide. Format attendu: +243XXXXXXXXX ou 0XXXXXXXXX'),
});

// Create order schema (Main)
export const createOrderSchema = z.object({
  // Customer info (required for guests, optional for authenticated users)
  customerId: z.string()
    .uuid('L\'ID client doit être un UUID valide')
    .optional(),
  
  guestInfo: guestCustomerSchema.optional(),
  
  // Order items
  items: z.array(orderItemSchema)
    .min(1, 'Au moins un article est requis')
    .max(50, 'Maximum 50 articles par commande'),
  
  // Delivery method
  deliveryMethod: z.nativeEnum(DeliveryMethod, {
    errorMap: () => ({ message: 'Méthode de livraison invalide' })
  }),
  
  // Delivery address (required if HOME_DELIVERY)
  deliveryAddress: deliveryAddressSchema.optional(),
  
  // Payment method
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Méthode de paiement invalide' })
  }),
  
  // Payment reference (for mobile money)
  paymentReference: z.string()
    .max(100, 'La référence de paiement ne peut pas dépasser 100 caractères')
    .optional(),
  
  // Optional notes
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional(),
  
  // Save customer info (for authenticated users)
  saveCustomerInfo: z.boolean().optional(),
}).refine(
  (data) => {
    // If delivery method is HOME_DELIVERY, deliveryAddress is required
    if (data.deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      return !!data.deliveryAddress;
    }
    return true;
  },
  {
    message: 'L\'adresse de livraison est requise pour la livraison à domicile',
    path: ['deliveryAddress'],
  }
).refine(
  (data) => {
    // Either customerId or guestInfo must be provided
    return !!data.customerId || !!data.guestInfo;
  },
  {
    message: 'Les informations client sont requises',
    path: ['guestInfo'],
  }
);

// Update order status schema
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ], {
    errorMap: () => ({ message: 'Statut de commande invalide' })
  }),
  
  paymentStatus: z.enum([
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
  ], {
    errorMap: () => ({ message: 'Statut de paiement invalide' })
  }).optional(),
  
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional(),
});

// Order query parameters schema
export const orderQuerySchema = z.object({
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
  
  status: z.string().optional(),
  
  paymentStatus: z.string().optional(),
  
  customerId: z.string().uuid('L\'ID client doit être un UUID valide').optional(),
  
  dateFrom: z.string().optional(),
  
  dateTo: z.string().optional(),
});

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>;
export type GuestCustomerInput = z.infer<typeof guestCustomerSchema>;
