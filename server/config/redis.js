const Redis = require('ioredis');

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Connection event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err.message);
});

redisClient.on('close', () => {
  console.log('⚠️  Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️  Application will continue without caching');
  }
};

// Graceful shutdown
const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    console.log('✅ Redis disconnected gracefully');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error.message);
  }
};

// Helper functions for caching
const cache = {
  // Get value from cache
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  },

  // Set value in cache with TTL (in seconds)
  set: async (key, value, ttl = 300) => {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  },

  // Delete specific key
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  },

  // Delete keys by pattern
  delPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error.message);
      return false;
    }
  },

  // Check if Redis is available
  isAvailable: () => {
    return redisClient.status === 'ready';
  },
};

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
  cache,
};
