import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token and attaches user info to req.user
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise. Aucun token fourni.'
      });
      return;
    }

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET non configuré');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Le token a expiré. Veuillez vous reconnecter.'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        success: false,
        message: 'Token invalide. Accès refusé.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token.'
    });
  }
};

/**
 * Middleware to authorize specific roles
 * Must be used after authenticateToken middleware
 * 
 * @param roles - Array of allowed roles (e.g., ['ADMIN', 'MANAGER'])
 * @returns Middleware function
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${roles.join(' ou ')}. Votre rôle: ${req.user.role}`
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token exists but doesn't fail if missing
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    // Silently continue without user if token is invalid
    next();
  }
};
