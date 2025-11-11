import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

/**
 * Schema for tracking order by order number (public endpoint)
 * Requires email or phone for security verification
 */
export const trackOrderByNumberSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  phone: z.string().regex(/^\+243\d{9}$/, 'Numéro de téléphone invalide').optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Email ou numéro de téléphone requis pour la vérification',
    path: ['email'],
  }
);

/**
 * Schema for filtering customer orders
 */
export const customerOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

export type TrackOrderByNumberInput = z.infer<typeof trackOrderByNumberSchema>;
export type CustomerOrdersQueryInput = z.infer<typeof customerOrdersQuerySchema>;
