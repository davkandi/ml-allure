import winston from 'winston';
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development (human-readable)
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Production format (JSON for CloudWatch/structured logging)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create transports array
const transports: winston.transport[] = [];

if (isDevelopment) {
  // Development: Log to console with colors
  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );

  // Development: Also log to files for persistence
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: prodFormat,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: prodFormat,
    })
  );
} else {
  // Production: JSON logs to stdout (for CloudWatch)
  transports.push(
    new winston.transports.Console({
      format: prodFormat,
    })
  );

  // Production: Error logs to file for backup
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: prodFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels,
  transports,
  // Prevent Winston from exiting on error
  exitOnError: false,
});

/**
 * Log HTTP requests with structured data
 */
export function logRequest(req: {
  method: string;
  url: string;
  ip?: string;
  userId?: number;
  userRole?: string;
}) {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.userId,
    userRole: req.userRole,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log HTTP responses with structured data
 */
export function logResponse(req: {
  method: string;
  url: string;
  statusCode: number;
  responseTime?: number;
  userId?: number;
}) {
  const level = req.statusCode >= 500 ? 'error' : req.statusCode >= 400 ? 'warn' : 'http';

  logger.log(level, 'HTTP Response', {
    method: req.method,
    url: req.url,
    statusCode: req.statusCode,
    responseTime: req.responseTime,
    userId: req.userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log security events (authentication, authorization failures, etc.)
 */
export function logSecurityEvent(event: {
  type: 'AUTH_FAILURE' | 'AUTHZ_FAILURE' | 'INVALID_TOKEN' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT';
  message: string;
  userId?: number;
  ip?: string;
  details?: any;
}) {
  logger.warn('Security Event', {
    eventType: event.type,
    message: event.message,
    userId: event.userId,
    ip: event.ip,
    details: event.details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log database operations
 */
export function logDatabaseOperation(operation: {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  duration?: number;
  recordCount?: number;
  error?: Error;
}) {
  if (operation.error) {
    logger.error('Database Operation Failed', {
      operationType: operation.type,
      table: operation.table,
      duration: operation.duration,
      error: operation.error.message,
      stack: operation.error.stack,
      timestamp: new Date().toISOString(),
    });
  } else {
    logger.debug('Database Operation', {
      operationType: operation.type,
      table: operation.table,
      duration: operation.duration,
      recordCount: operation.recordCount,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log payment transactions
 */
export function logPaymentEvent(event: {
  type: 'PAYMENT_INITIATED' | 'PAYMENT_VERIFIED' | 'PAYMENT_FAILED' | 'REFUND';
  orderId: number;
  amount: number;
  provider?: string;
  reference?: string;
  userId?: number;
  error?: Error;
}) {
  const level = event.error ? 'error' : 'info';

  logger.log(level, 'Payment Event', {
    eventType: event.type,
    orderId: event.orderId,
    amount: event.amount,
    provider: event.provider,
    reference: event.reference,
    userId: event.userId,
    error: event.error?.message,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log application errors with context
 */
export function logError(error: Error, context?: {
  userId?: number;
  url?: string;
  operation?: string;
  additionalInfo?: any;
}) {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    userId: context?.userId,
    url: context?.url,
    operation: context?.operation,
    additionalInfo: context?.additionalInfo,
    timestamp: new Date().toISOString(),
  });
}

// Export the logger instance and convenience methods
export default logger;

// Export convenience methods that match console API for easy migration
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
};
