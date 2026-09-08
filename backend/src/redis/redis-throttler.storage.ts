import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    _limit?: number,
    _blockDuration?: number,
    _throttlerName?: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000));
    const totalHits = await this.redis.incr(`throttle:${key}`, ttlSeconds);
    const ttlLeft = Math.max(1, await this.redis.ttl(`throttle:${key}`));
    return {
      totalHits,
      timeToExpire: ttlLeft * 1000,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
