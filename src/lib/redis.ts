// Redis is disabled - using MySQL only
// All functions return null/false to gracefully handle missing Redis

// Test connection - always returns false since Redis is disabled
export async function testRedisConnection() {
  return false;
}

// Cache functions - all return null/false since Redis is disabled
export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  // No-op: Redis is disabled
  return false;
}

export async function cacheGet(key: string) {
  // No-op: Redis is disabled
  return null;
}

export async function cacheDelete(key: string) {
  // No-op: Redis is disabled
  return false;
}

export async function cacheClear() {
  // No-op: Redis is disabled
  return false;
}

// Export null as default to maintain compatibility
export default null;
