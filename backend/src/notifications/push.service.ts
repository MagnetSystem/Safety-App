import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Delivers notifications through Expo's push service. Best-effort: any failure
 * is logged and swallowed so it never blocks the API response. The in-app
 * feed (Notification rows) remains the source of truth.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (userIds.length === 0) return;
    const rows = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    await this.sendToTokens(
      rows.map((r) => r.token),
      payload,
    );
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<void> {
    const valid = tokens.filter((t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));
    if (valid.length === 0) return;

    const messages = valid.map((to) => ({
      to,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      priority: 'high',
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push responded ${res.status}`);
        return;
      }
      const json = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      const dead: string[] = [];
      json.data?.forEach((ticket, i) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          dead.push(valid[i]);
        }
      });
      if (dead.length > 0) {
        await this.prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
        this.logger.debug(`Pruned ${dead.length} stale push tokens`);
      }
    } catch (err) {
      this.logger.warn(`Push send failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async registerToken(userId: string, token: string, platform?: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, updatedAt: new Date() },
    });
  }

  async removeToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
    return { success: true };
  }
}
