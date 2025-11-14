/**
 * Database Connection Pooling Configuration
 *
 * This module provides optimized connection pooling for the database
 * to improve performance and handle concurrent requests efficiently.
 */

// For Turso/libSQL (current setup)
import { createClient } from '@libsql/client';

interface PoolConfig {
  url: string;
  authToken?: string;
  maxConnections?: number;
  idleTimeout?: number;
}

class DatabasePool {
  private client: any;
  private config: PoolConfig;

  constructor(config: PoolConfig) {
    this.config = {
      maxConnections: 10,
      idleTimeout: 60000, // 60 seconds
      ...config,
    };

    this.initialize();
  }

  private initialize() {
    // Create Turso client with connection pooling
    this.client = createClient({
      url: this.config.url,
      authToken: this.config.authToken,
    });

    console.log('[Database Pool] Initialized with config:', {
      url: this.config.url.substring(0, 20) + '...',
      maxConnections: this.config.maxConnections,
      idleTimeout: this.config.idleTimeout,
    });
  }

  getClient() {
    return this.client;
  }

  async close() {
    // Close the database connection
    if (this.client?.close) {
      await this.client.close();
      console.log('[Database Pool] Closed');
    }
  }
}

// Create and export the pool instance
export const dbPool = new DatabasePool({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000'),
});

/**
 * PostgreSQL Connection Pooling (for production with RDS)
 *
 * When migrating to PostgreSQL/RDS, use pg-pool:
 *
 * npm install pg
 *
 * import { Pool } from 'pg';
 *
 * export const pgPool = new Pool({
 *   host: process.env.DB_HOST,
 *   port: parseInt(process.env.DB_PORT || '5432'),
 *   database: process.env.DB_NAME,
 *   user: process.env.DB_USER,
 *   password: process.env.DB_PASSWORD,
 *   max: 20, // Maximum number of clients in the pool
 *   idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
 *   connectionTimeoutMillis: 2000, // How long to wait when connecting
 *   // SSL configuration for RDS
 *   ssl: process.env.NODE_ENV === 'production' ? {
 *     rejectUnauthorized: false
 *   } : false,
 * });
 *
 * pgPool.on('connect', (client) => {
 *   console.log('[PostgreSQL Pool] New client connected');
 * });
 *
 * pgPool.on('error', (err, client) => {
 *   console.error('[PostgreSQL Pool] Unexpected error:', err);
 * });
 */

// Export helper to execute queries with automatic connection management
export async function executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T> {
  const client = dbPool.getClient();

  try {
    return await queryFn(client);
  } catch (error) {
    console.error('[Database Pool] Query error:', error);
    throw error;
  }
}
