import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Optional Redis. If REDIS_URL is missing the process still boots and every
 * helper falls back to a process-local Map so local/dev keeps working.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memory = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL is not set — cache, queues and distributed rate limits use in-memory fallback');
      return;
    }
    const redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 2_000,
      commandTimeout: 1_500,
      enableOfflineQueue: false,
    });
    redis.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    try {
      await redis.connect();
      this.client = redis;
      this.logger.log('Connected to Redis');
    } catch (err) {
      this.logger.warn(`Redis unavailable, falling back to memory: ${(err as Error).message}`);
      redis.disconnect();
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client) return await this.client.get(key);
    } catch (err) {
      this.logger.warn(`Redis get failed: ${(err as Error).message}`);
      return null;
    }
    const row = this.memory.get(key);
    if (!row) return null;
    if (row.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return row.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      if (this.client) {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      }
    } catch (err) {
      this.logger.warn(`Redis set failed: ${(err as Error).message}`);
      return;
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client) {
        await this.client.del(key);
        return;
      }
    } catch (err) {
      this.logger.warn(`Redis del failed: ${(err as Error).message}`);
      return;
    }
    this.memory.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      if (this.client) {
        const keys = await this.client.keys(`${prefix}*`);
        if (keys.length) await this.client.del(...keys);
        return;
      }
    } catch (err) {
      this.logger.warn(`Redis delByPrefix failed: ${(err as Error).message}`);
      return;
    }
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    try {
      if (this.client) {
        const count = await this.client.incr(key);
        if (count === 1) await this.client.expire(key, ttlSeconds);
        return count;
      }
    } catch (err) {
      this.logger.warn(`Redis incr failed: ${(err as Error).message}`);
      return 1;
    }
    const current = Number((await this.get(key)) ?? '0') + 1;
    await this.set(key, String(current), ttlSeconds);
    return current;
  }

  async ttl(key: string): Promise<number> {
    try {
      if (this.client) return await this.client.ttl(key);
    } catch (err) {
      this.logger.warn(`Redis ttl failed: ${(err as Error).message}`);
      return -2;
    }
    const row = this.memory.get(key);
    if (!row) return -2;
    return Math.max(0, Math.ceil((row.expiresAt - Date.now()) / 1000));
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async enqueue(queue: string, payload: unknown): Promise<void> {
    const body = JSON.stringify(payload);
    if (this.client) {
      await this.client.lpush(`queue:${queue}`, body);
      return;
    }
    setImmediate(() => {
      this.logger.debug(`In-memory queue ${queue} job (no Redis)`);
    });
  }

  async dequeue(queue: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.rpop(`queue:${queue}`);
  }
}
