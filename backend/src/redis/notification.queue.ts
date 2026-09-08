import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { NotificationsService } from '../notifications/notifications.service';

interface NotifyJob {
  kind: 'one' | 'many';
  payload: {
    userId?: string;
    userIds?: string[];
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
}

/**
 * Pushes notification fan-out off the request thread when Redis is available.
 * Without Redis the job runs immediately so local/dev behaviour is unchanged.
 */
@Injectable()
export class NotificationQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueue.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.drain(), 400);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async enqueueOne(input: NotifyJob['payload'] & { userId: string }) {
    if (!this.redis.isConnected()) {
      await this.notifications.create(input as any);
      return;
    }
    await this.redis.enqueue('notify', { kind: 'one', payload: input });
  }

  async enqueueMany(inputs: Array<NotifyJob['payload'] & { userId: string }>) {
    if (!this.redis.isConnected() || inputs.length === 0) {
      if (inputs.length) await this.notifications.createMany(inputs as any);
      return;
    }
    await this.redis.enqueue('notify', { kind: 'many', payload: { userIds: inputs.map((i) => i.userId), ...inputs[0], items: inputs } });
  }

  private async drain() {
    if (this.running || !this.redis.isConnected()) return;
    this.running = true;
    try {
      for (let i = 0; i < 20; i++) {
        const raw = await this.redis.dequeue('notify');
        if (!raw) break;
        const job = JSON.parse(raw) as NotifyJob & { payload: any };
        if (job.kind === 'many' && Array.isArray(job.payload.items)) {
          await this.notifications.createMany(job.payload.items);
        } else if (job.payload.userId) {
          await this.notifications.create(job.payload);
        }
      }
    } catch (err) {
      this.logger.warn(`Notify queue drain failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
