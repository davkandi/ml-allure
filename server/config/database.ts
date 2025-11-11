import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../../src/db/schema';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get Drizzle database instance with Turso connection
 * Implements singleton pattern for connection reuse
 */
export function getDatabase() {
  if (db) {
    return db;
  }

  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });

    db = drizzle(client, { schema });
    
    console.log('✅ Database connection established successfully');
    return db;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error('Impossible de se connecter à la base de données');
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const database = getDatabase();
    // Simple query to test connection
    await database.select().from(schema.users).limit(1);
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown - close database connections
 */
export function closeDatabaseConnection() {
  if (db) {
    console.log('🔌 Closing database connection...');
    db = null;
  }
}

// Handle process termination
process.on('SIGTERM', closeDatabaseConnection);
process.on('SIGINT', closeDatabaseConnection);
process.on('exit', closeDatabaseConnection);

// Export database instance
export const database = getDatabase();