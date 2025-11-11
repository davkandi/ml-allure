const { cache } = require('../config/redis');

/**
 * Redis caching middleware for Express
 * Caches GET requests and invalidates on POST/PUT/DELETE
 */

// Generate cache key from request
const generateCacheKey = (req) => {
  const baseUrl = req.originalUrl || req.url;
  const queryString = Object.keys(req.query).length > 0 
    ? JSON.stringify(req.query) 
    : '';
  return `cache:${baseUrl}:${queryString}`;
};

// Extract resource pattern from URL for invalidation
const getResourcePattern = (url) => {
  // Extract base resource (e.g., /api/products, /api/orders)
  const match = url.match(/^\/api\/([^\/]+)/);
  return match ? `cache:/api/${match[1]}*` : null;
};

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not available
    if (!cache.isAvailable()) {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      // Try to get cached response
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.status(200).json({
          ...cachedData,
          _cached: true,
          _cachedAt: new Date().toISOString(),
        });
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data) {
        // Only cache successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl).catch((err) => {
            console.error('Failed to cache response:', err.message);
          });
        }

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Cache invalidation middleware for POST/PUT/DELETE requests
 */
const invalidateCache = async (req, res, next) => {
  // Only invalidate on mutation requests
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip if Redis is not available
  if (!cache.isAvailable()) {
    return next();
  }

  // Get resource pattern for invalidation
  const pattern = getResourcePattern(req.originalUrl || req.url);

  if (pattern) {
    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after successful response
    res.json = async function (data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await cache.delPattern(pattern);
          console.log(`🗑️  Cache invalidated: ${pattern}`);
        } catch (error) {
          console.error('Failed to invalidate cache:', error.message);
        }
      }

      // Call original json function
      return originalJson(data);
    };
  }

  next();
};

/**
 * Specific cache configurations for different resources
 */
const cacheConfig = {
  // Product listings - 10 minutes (frequently viewed, moderate change rate)
  products: cacheMiddleware(600),
  
  // Category data - 30 minutes (rarely changes)
  categories: cacheMiddleware(1800),
  
  // Frequently accessed orders - 2 minutes (changes frequently)
  orders: cacheMiddleware(120),
  
  // Order details - 5 minutes
  orderDetails: cacheMiddleware(300),
  
  // Inventory data - 1 minute (changes frequently in POS)
  inventory: cacheMiddleware(60),
  
  // Transactions - 5 minutes
  transactions: cacheMiddleware(300),
  
  // Product details - 15 minutes
  productDetails: cacheMiddleware(900),
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  cacheConfig,
  generateCacheKey,
};
