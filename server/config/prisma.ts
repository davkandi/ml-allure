import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development with hot reloading
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Test Prisma connection
 */
export async function testPrismaConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Prisma database connection failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown - disconnect Prisma
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Prisma disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting Prisma:', error);
  }
}

// Handle process termination
process.on('SIGTERM', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('exit', disconnectPrisma);

export default prisma;
