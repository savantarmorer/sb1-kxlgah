import { Redis } from '@upstash/redis';
import { RateLimitConfig, RateLimitInfo } from '@/types/tournament';

export class RateLimiter {
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.redis = new Redis({
      url: redisUrl || process.env.REDIS_URL || '',
      token: process.env.REDIS_TOKEN || ''
    });
  }

  async checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `${key}:${Math.floor(now / config.window_seconds)}`;
    
    const current = await this.redis.incr(windowKey);
    if (current === 1) {
      await this.redis.expire(windowKey, config.window_seconds);
    }

    const remaining = Math.max(0, config.max_requests - current);
    const reset = Math.ceil(now / config.window_seconds) * config.window_seconds;

    return {
      remaining,
      reset
    };
  }

  async resetLimit(key: string): Promise<void> {
    const pattern = `${key}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
} 