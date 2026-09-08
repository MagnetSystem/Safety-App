import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.redis.getJson<T>(key);
      if (hit !== null) return hit;
    } catch {
      // cache miss on Redis errors — never block the request
    }
    const value = await loader();
    void this.redis.setJson(key, value, ttlSeconds).catch(() => undefined);
    return value;
  }

  invalidateOrg(organizationId: string) {
    return Promise.all([
      this.redis.del(this.orgKey(organizationId, 'detail')),
      this.redis.del(this.orgKey(organizationId, 'departments')),
    ]);
  }

  del(key: string) {
    return this.redis.del(key);
  }

  orgKey(organizationId: string, suffix: string) {
    return `org:${organizationId}:${suffix}`;
  }
}
