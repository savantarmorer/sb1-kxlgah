import Redis from 'ioredis';
import { CACHE_CONFIG } from '@/config';

class RedisCache {
  private client: Redis;
  private readonly defaultTTL: number;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL as string);
    this.defaultTTL = CACHE_CONFIG.defaultTTL;

    this.client.on('error', (err) => {
      console.error('Redis Cache Error:', err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache Get Error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.setex(key, this.defaultTTL, serialized);
      }
    } catch (error) {
      console.error('Cache Set Error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Cache Invalidation Error:', error);
    }
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}

export const cache = new RedisCache(); 