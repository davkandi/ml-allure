import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRoles, hasRole, createAuthErrorResponse } from '../auth';

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Authentication Library', () => {
  describe('requireAuth', () => {
    it('should successfully authenticate with valid token in cookie', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          cookie: `token=${token}`,
        },
      });

      const result = requireAuth(request);

      expect(result.success).toBe(true);
      expect(result.authResult.authenticated).toBe(true);
      expect(result.authResult.user).toBeDefined();
      expect(result.authResult.user!.id).toBe(1);
      expect(result.authResult.user!.email).toBe('test@example.com');
      expect(result.authResult.user!.role).toBe('CUSTOMER');
    });

    it('should successfully authenticate with valid token in Authorization header', () => {
      const payload = {
        id: 2,
        email: 'admin@example.com',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = requireAuth(request);

      expect(result.success).toBe(true);
      expect(result.authResult.user!.role).toBe('ADMIN');
    });

    it('should fail with missing token', () => {
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = requireAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No authentication token provided');
    });

    it('should fail with invalid token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      const result = requireAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid token');
    });

    it('should fail with expired token', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = requireAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token expired');
    });

    it('should fail with token signed with wrong secret', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        role: 'CUSTOMER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, 'wrong-secret');

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = requireAuth(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid token');
    });
  });

  describe('requireRoles', () => {
    it('should allow access when user has required role', () => {
      const payload = {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = requireRoles(request, ['ADMIN']);

      expect(result.success).toBe(true);
      expect(result.authResult.user!.role).toBe('ADMIN');
    });

    it('should allow access when user has one of multiple required roles', () => {
      const payload = {
        id: 1,
        email: 'staff@example.com',
        role: 'STAFF',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = requireRoles(request, ['ADMIN', 'STAFF', 'SALES_STAFF']);

      expect(result.success).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      const payload = {
        id: 1,
        email: 'customer@example.com',
        role: 'CUSTOMER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = requireRoles(request, ['ADMIN']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });

    it('should fail if user is not authenticated', () => {
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = requireRoles(request, ['ADMIN']);

      expect(result.success).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const user = {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        iat: 0,
        exp: 0,
      };

      expect(hasRole(user, ['ADMIN'])).toBe(true);
    });

    it('should return true when user has one of multiple roles', () => {
      const user = {
        id: 1,
        email: 'staff@example.com',
        role: 'STAFF' as const,
        iat: 0,
        exp: 0,
      };

      expect(hasRole(user, ['ADMIN', 'STAFF', 'INVENTORY_MANAGER'])).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const user = {
        id: 1,
        email: 'customer@example.com',
        role: 'CUSTOMER' as const,
        iat: 0,
        exp: 0,
      };

      expect(hasRole(user, ['ADMIN'])).toBe(false);
    });
  });

  describe('createAuthErrorResponse', () => {
    it('should create a 401 unauthorized response', () => {
      const response = createAuthErrorResponse('Authentication required', 401);

      expect(response.status).toBe(401);
    });

    it('should create a 403 forbidden response', () => {
      const response = createAuthErrorResponse('Insufficient permissions', 403);

      expect(response.status).toBe(403);
    });

    it('should include error message in response body', async () => {
      const response = createAuthErrorResponse('Test error', 401);
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error).toBe('Test error');
      expect(body.code).toBe('AUTHENTICATION_ERROR');
    });
  });
});
