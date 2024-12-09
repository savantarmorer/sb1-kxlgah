import { cache } from '@/lib/cache/redisCache';

interface RateLimiterOptions {
  maxRequests: number;
  perSeconds: number;
}

export class RateLimiter {
  private maxRequests: number;
  private perSeconds: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.perSeconds = options.perSeconds;
  }

  /**
   * Try to acquire a rate limit token
   */
  async tryAcquire(key: string): Promise<boolean> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (this.perSeconds * 1000))}`;

    try {
      // Get current count
      const count = await cache.get<number>(windowKey) || 0;

      if (count >= this.maxRequests) {
        return false;
      }

      // Increment count
      await cache.set(windowKey, count + 1, this.perSeconds);
      return true;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // In case of error, allow the request
      return true;
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (this.perSeconds * 1000))}`;
    await cache.invalidate(windowKey);
  }

  /**
   * Get remaining requests for a key
   */
  async getRemainingRequests(key: string): Promise<number> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (this.perSeconds * 1000))}`;
    const count = await cache.get<number>(windowKey) || 0;
    return Math.max(0, this.maxRequests - count);
  }
} 