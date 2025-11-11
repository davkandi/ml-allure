import { Request, Response, NextFunction } from 'express';
import { LibsqlError } from '@libsql/client';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
}

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error caught by error handler:');
    console.error('Path:', req.method, req.path);
    console.error('Error:', err);
  }

  // Default error response
  let statusCode = 500;
  let message = 'Une erreur interne du serveur est survenue.';
  const response: ErrorResponse = {
    success: false,
    message: ''
  };

  // Handle specific error types
  
  // Drizzle/LibSQL Database Errors
  if (err instanceof LibsqlError || err.name === 'LibsqlError') {
    const dbError = err as LibsqlError;
    
    // Unique constraint violation
    if (dbError.message.includes('UNIQUE constraint failed')) {
      statusCode = 409;
      const field = dbError.message.split(':')[1]?.trim() || 'champ';
      message = `Ce ${field} existe déjà. Veuillez en choisir un autre.`;
    }
    // Foreign key constraint
    else if (dbError.message.includes('FOREIGN KEY constraint failed')) {
      statusCode = 400;
      message = 'Impossible de supprimer cet élément car il est utilisé ailleurs.';
    }
    // Not found
    else if (dbError.message.includes('no such table')) {
      statusCode = 500;
      message = 'Erreur de configuration de la base de données.';
    }
    // Generic database error
    else {
      statusCode = 500;
      message = 'Erreur lors de l\'opération sur la base de données.';
    }
  }
  
  // Validation Errors (from Zod or custom validation)
  else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    statusCode = 400;
    message = 'Données de requête invalides.';
  }
  
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token d\'authentification invalide.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Votre session a expiré. Veuillez vous reconnecter.';
  }
  
  // Multer/File Upload Errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'Erreur lors du téléchargement du fichier.';
  }
  
  // Custom error with status code
  else if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    statusCode = (err as any).statusCode;
    message = err.message;
  }
  
  // Generic error
  else {
    message = err.message || message;
  }

  // Build response
  response.message = message;

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = err.name;
    response.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée.') {
    super(message, 404);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentification requise.') {
    super(message, 401);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit.') {
    super(message, 403);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Requête invalide.') {
    super(message, 400);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflit avec une ressource existante.') {
    super(message, 409);
  }
}
