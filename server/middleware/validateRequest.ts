import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Middleware factory to validate request body using Zod schemas
 * 
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 * @returns Middleware function
 */
export const validateRequest = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get data from specified source
      const dataToValidate = req[source];

      // Validate data against schema
      const validatedData = schema.parse(dataToValidate);

      // Replace request data with validated data
      req[source] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors in French
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: translateZodError(err)
        }));

        res.status(400).json({
          success: false,
          message: 'Les données fournies sont invalides.',
          errors: validationErrors
        });
        return;
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation des données.'
      });
    }
  };
};

/**
 * Translate Zod error messages to French
 */
function translateZodError(err: z.ZodIssue): string {
  const field = err.path[err.path.length - 1] || 'champ';

  switch (err.code) {
    case 'invalid_type':
      return `Le champ "${field}" doit être de type ${translateType(err.expected)}.`;
    
    case 'too_small':
      if (err.type === 'string') {
        return `Le champ "${field}" doit contenir au moins ${err.minimum} caractères.`;
      }
      if (err.type === 'number') {
        return `Le champ "${field}" doit être supérieur ou égal à ${err.minimum}.`;
      }
      if (err.type === 'array') {
        return `Le champ "${field}" doit contenir au moins ${err.minimum} éléments.`;
      }
      return `Le champ "${field}" est trop petit.`;
    
    case 'too_big':
      if (err.type === 'string') {
        return `Le champ "${field}" ne peut pas dépasser ${err.maximum} caractères.`;
      }
      if (err.type === 'number') {
        return `Le champ "${field}" doit être inférieur ou égal à ${err.maximum}.`;
      }
      if (err.type === 'array') {
        return `Le champ "${field}" ne peut pas contenir plus de ${err.maximum} éléments.`;
      }
      return `Le champ "${field}" est trop grand.`;
    
    case 'invalid_string':
      if (err.validation === 'email') {
        return `Le champ "${field}" doit être une adresse email valide.`;
      }
      if (err.validation === 'url') {
        return `Le champ "${field}" doit être une URL valide.`;
      }
      if (err.validation === 'uuid') {
        return `Le champ "${field}" doit être un UUID valide.`;
      }
      return `Le champ "${field}" contient une valeur invalide.`;
    
    case 'invalid_enum_value':
      return `Le champ "${field}" doit être l'une des valeurs suivantes: ${err.options.join(', ')}.`;
    
    case 'invalid_date':
      return `Le champ "${field}" doit être une date valide.`;
    
    case 'custom':
      return err.message || `Le champ "${field}" est invalide.`;
    
    default:
      return err.message || `Le champ "${field}" est invalide.`;
  }
}

/**
 * Translate Zod type names to French
 */
function translateType(type: string): string {
  const types: Record<string, string> = {
    string: 'chaîne de caractères',
    number: 'nombre',
    boolean: 'booléen',
    date: 'date',
    array: 'tableau',
    object: 'objet',
    null: 'null',
    undefined: 'indéfini'
  };

  return types[type] || type;
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  // Email validation
  email: z.string().email('Adresse email invalide'),
  
  // Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  
  // Phone number (French format)
  phone: z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro de téléphone invalide'),
  
  // Positive integer ID
  id: z.number().int().positive('L\'ID doit être un entier positif'),
  
  // Positive number (price, quantity, etc.)
  positiveNumber: z.number().positive('La valeur doit être positive'),
  
  // Date string
  dateString: z.string().datetime('Format de date invalide'),
};
