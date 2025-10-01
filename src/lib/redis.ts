import Redis from 'ioredis';

// Only create Redis client on server side
let redis: Redis | null = null;

if (typeof window === 'undefined') {
  // Server-side only
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 5,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    reconnectOnError: (err: any) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    retryDelayOnClusterDown: 300,
  };

  // Use REDIS_URL if provided, otherwise use individual config
  if (process.env.REDIS_URL) {
    // For production Redis URLs, add additional connection resilience
    const productionConfig = {
      ...redisConfig,
      maxRetriesPerRequest: 10,
      retryDelayOnFailover: 200,
      connectTimeout: 15000,
      commandTimeout: 10000,
      keepAlive: 60000,
      family: 4, // Force IPv4 for better compatibility
      tls: process.env.REDIS_URL.includes('rediss://') ? {} : undefined,
    };
    redis = new Redis(process.env.REDIS_URL, productionConfig);
  } else {
    redis = new Redis(redisConfig);
  }

  // Connection event handlers
  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redis.on('ready', () => {
    console.log('🚀 Redis is ready to accept commands');
  });

  redis.on('error', (err: any) => {
    console.error('❌ Redis connection error:', err);
    // Attempt to reconnect on critical errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.log('🔄 Attempting to reconnect to Redis...');
    }
  });

  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  redis.on('end', () => {
    console.log('🔚 Redis connection ended');
  });

  // Health check and reconnection logic
  setInterval(async () => {
    if (redis && redis.status === 'ready') {
      try {
        await redis.ping();
      } catch (error) {
        console.log('🏓 Redis health check failed, attempting reconnection...');
        // Only reconnect if not already connecting/connected
        if (redis.status !== 'ready' && redis.status !== 'connecting') {
          try {
            await redis.connect();
          } catch (connectError) {
            console.error('❌ Failed to reconnect to Redis:', connectError);
          }
        }
      }
    }
  }, 30000); // Check every 30 seconds

  // Handle process termination gracefully
  process.on('SIGINT', () => {
    if (redis) {
      console.log('🔄 Gracefully closing Redis connection...');
      redis.disconnect();
    }
  });

  process.on('SIGTERM', () => {
    if (redis) {
      console.log('🔄 Gracefully closing Redis connection...');
      redis.disconnect();
    }
  });
}

// Test connection
export async function testRedisConnection() {
  if (!redis) {
    console.log('❌ Redis client not available (client-side)');
    return false;
  }
  
  try {
    await redis.ping();
    console.log('🏓 Redis ping successful');
    return true;
  } catch (error) {
    console.error('❌ Redis ping failed:', error);
    return false;
  }
}

// Cache functions
export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  if (!redis) {
    console.log('❌ Redis client not available (client-side)');
    return false;
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    await redis.setex(key, ttl, serializedValue);
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error('❌ Cache set error:', error);
    return false;
  }
}

export async function cacheGet(key: string) {
  if (!redis) {
    console.log('❌ Redis client not available (client-side)');
    return null;
  }
  
  try {
    const value = await redis.get(key);
    if (value) {
      console.log(`📖 Cache hit: ${key}`);
      return JSON.parse(value);
    }
    console.log(`❌ Cache miss: ${key}`);
    return null;
  } catch (error) {
    console.error('❌ Cache get error:', error);
    return null;
  }
}

export async function cacheDelete(key: string) {
  if (!redis) {
    console.log('❌ Redis client not available (client-side)');
    return false;
  }
  
  try {
    await redis.del(key);
    console.log(`🗑️ Cache deleted: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Cache delete error:', error);
    return false;
  }
}

export async function cacheClear() {
  if (!redis) {
    console.log('❌ Redis client not available (client-side)');
    return false;
  }
  
  try {
    await redis.flushdb();
    console.log('🧹 Cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    return false;
  }
}

export default redis;
