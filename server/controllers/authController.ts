import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../config/database';
import { users, customers } from '../../src/db/schema';
import { AuthRequest } from '../middleware/auth';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  RefreshTokenInput,
  GuestCheckoutInput,
} from '../schemas/authSchemas';

// POST /api/auth/register
export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone }: RegisterInput = req.body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà',
      });
    }

    // Hash password (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with CUSTOMER role
    const now = Date.now();
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'CUSTOMER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create associated Customer record
    await db.insert(customers).values({
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      isGuest: false,
      createdAt: now,
      updatedAt: now,
    });

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user info without password
    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
    });
  }
};

// POST /api/auth/login
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password }: LoginInput = req.body;

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Veuillez contacter le support',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
    });
  }
};

// GET /api/auth/me (Protected)
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Get user profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Get customer info if role is CUSTOMER
    let customerInfo = null;
    if (user.role === 'CUSTOMER') {
      customerInfo = await db.query.customers.findFirst({
        where: eq(customers.userId, user.id),
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      customer: customerInfo
        ? {
            id: customerInfo.id,
            email: customerInfo.email,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
            addresses: customerInfo.addresses,
          }
        : null,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token }: RefreshTokenInput = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      role: string;
    };

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      token: newToken,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
};

// POST /api/auth/change-password (Protected)
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const { currentPassword, newPassword }: ChangePasswordInput = req.body;

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: Date.now(),
      })
      .where(eq(users.id, user.id));

    return res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du mot de passe',
    });
  }
};

// POST /api/auth/guest-checkout
export const guestCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { email, firstName, lastName, phone }: GuestCheckoutInput = req.body;

    // Create guest customer (no userId, isGuest: true)
    const now = Date.now();
    const [guestCustomer] = await db
      .insert(customers)
      .values({
        userId: null,
        email,
        firstName,
        lastName,
        phone,
        isGuest: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Generate temporary guest token (expires in 24 hours)
    const guestToken = jwt.sign(
      {
        customerId: guestCustomer.id,
        email: guestCustomer.email,
        isGuest: true,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Session invité créée avec succès',
      token: guestToken,
      customer: {
        id: guestCustomer.id,
        email: guestCustomer.email,
        firstName: guestCustomer.firstName,
        lastName: guestCustomer.lastName,
        phone: guestCustomer.phone,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error('Guest checkout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la session invité',
    });
  }
};
