import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const hit = await this.redis.getJson<T>(key);
    if (hit !== null) return hit;
    const value = await loader();
    await this.redis.setJson(key, value, ttlSeconds);
    return value;
  }

  invalidateOrg(organizationId: string) {
    return this.redis.delByPrefix(`org:${organizationId}:`);
  }

  del(key: string) {
    return this.redis.del(key);
  }

  orgKey(organizationId: string, suffix: string) {
    return `org:${organizationId}:${suffix}`;
  }
}
