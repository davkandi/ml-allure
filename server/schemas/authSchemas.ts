import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  email: z
    .string({ required_error: "L'email est requis" })
    .email({ message: "Format d'email invalide" }),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
    .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' }),
  firstName: z
    .string({ required_error: 'Le prénom est requis' })
    .min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  phone: z
    .string({ required_error: 'Le numéro de téléphone est requis' })
    .min(8, { message: 'Numéro de téléphone invalide' }),
});

// Login schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: "L'email est requis" })
    .email({ message: "Format d'email invalide" }),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(1, { message: 'Le mot de passe est requis' }),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Le mot de passe actuel est requis' }),
  newPassword: z
    .string({ required_error: 'Le nouveau mot de passe est requis' })
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
    .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' }),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  token: z.string({ required_error: 'Le token est requis' }),
});

// Guest checkout schema
export const guestCheckoutSchema = z.object({
  email: z
    .string({ required_error: "L'email est requis" })
    .email({ message: "Format d'email invalide" }),
  firstName: z
    .string({ required_error: 'Le prénom est requis' })
    .min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  phone: z
    .string({ required_error: 'Le numéro de téléphone est requis' })
    .min(8, { message: 'Numéro de téléphone invalide' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
