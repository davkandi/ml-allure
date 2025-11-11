import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import fileUpload from 'express-fileupload';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { testConnection } from './config/database';
import { testPrismaConnection } from './config/prisma';
import { connectRedis, disconnectRedis } from './config/redis';
import { invalidateCache } from './middleware/cache';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/order.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.SERVER_PORT || 5000;

// Security Headers
app.use(helmet());

// CORS Configuration - Allow Next.js frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Compression middleware - compress all responses
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Request Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File Upload Middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Cache invalidation middleware - must be before routes
app.use(invalidateCache);

// Rate Limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'ML Allure API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée.`
  });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connections
    await testConnection(); // Drizzle/Turso
    await testPrismaConnection(); // Prisma
    
    // Connect to Redis (non-blocking - app continues without Redis if it fails)
    await connectRedis();
    
    // Graceful shutdown handler
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM signal received: closing HTTP server');
      await disconnectRedis();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT signal received: closing HTTP server');
      await disconnectRedis();
      process.exit(0);
    });

    app.listen(PORT, () => {
      console.log(`\n╔═══════════════════════════════════════════╗`);
      console.log(`║                                           ║`);
      console.log(`║        🎀 ML ALLURE API SERVER 🎀        ║`);
      console.log(`║                                           ║`);
      console.log(`║  Server: http://localhost:${PORT}           ║`);
      console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(23)} ║`);
      console.log(`║  Frontend: ${(process.env.FRONTEND_URL || 'http://localhost:3000').padEnd(25)} ║`);
      console.log(`║                                           ║`);
      console.log(`║  📍 Health: GET /health                   ║`);
      console.log(`║  🔐 Auth: POST /api/auth/register        ║`);
      console.log(`║  🔐 Auth: POST /api/auth/login           ║`);
      console.log(`║  🔐 Auth: GET /api/auth/me               ║`);
      console.log(`║  🛒 Orders: POST /api/orders             ║`);
      console.log(`║  🛒 Orders: GET /api/orders              ║`);
      console.log(`║                                           ║`);
      console.log(`╚═══════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;