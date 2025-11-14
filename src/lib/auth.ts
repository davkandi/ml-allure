/**
 * Authentication utilities for API routes
 * Uses jsonwebtoken for Node.js API routes (not Edge middleware)
 */

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT Payload interface
export interface JwtPayload {
  id: number;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'INVENTORY_MANAGER' | 'SALES_STAFF';
  iat: number;
  exp: number;
}

// Auth result interface
export interface AuthResult {
  authenticated: boolean;
  user?: JwtPayload;
  error?: string;
}

/**
 * Extract and verify JWT token from request
 */
export function verifyToken(request: NextRequest): AuthResult {
  try {
    // Get token from cookie or Authorization header
    const token =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return {
        authenticated: false,
        error: 'No authentication token provided',
      };
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Validate payload structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      return {
        authenticated: false,
        error: 'Invalid token payload',
      };
    }

    return {
      authenticated: true,
      user: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        authenticated: false,
        error: 'Token has expired',
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        authenticated: false,
        error: 'Invalid token',
      };
    }

    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: JwtPayload | undefined,
  allowedRoles: string[]
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Middleware to require authentication
 * Returns error response if not authenticated
 */
export function requireAuth(request: NextRequest) {
  const authResult = verifyToken(request);

  if (!authResult.authenticated) {
    return {
      success: false,
      authResult,
    };
  }

  return {
    success: true,
    authResult,
  };
}

/**
 * Middleware to require specific roles
 */
export function requireRoles(request: NextRequest, allowedRoles: string[]) {
  const { success, authResult } = requireAuth(request);

  if (!success) {
    return {
      success: false,
      authResult,
      error: 'Authentication required',
    };
  }

  if (!hasRole(authResult.user, allowedRoles)) {
    return {
      success: false,
      authResult,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    authResult,
  };
}

/**
 * Helper to create standardized auth error responses
 */
export function createAuthErrorResponse(error: string, statusCode: number = 401) {
  return Response.json(
    {
      success: false,
      error,
      code: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
