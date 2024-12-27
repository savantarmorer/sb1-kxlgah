import { Redis, RedisOptions } from 'ioredis';

class RedisService {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!RedisService.instance) {
      const config: RedisOptions = {
        host: import.meta.env.VITE_REDIS_HOST || 'localhost',
        port: Number(import.meta.env.VITE_REDIS_PORT) || 6379,
        password: import.meta.env.VITE_REDIS_PASSWORD,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false
      };

      RedisService.instance = new Redis(config);

      RedisService.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      RedisService.instance.on('connect', () => {
        console.log('Connected to Redis');
      });
    }

    return RedisService.instance;
  }

  static async disconnect(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.quit();
      RedisService.instance = null;
    }
  }
}

export const redis = RedisService.getInstance(); 