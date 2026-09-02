import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated } from '../common/dto/pagination.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the in-app notification row. FCM push delivery is a stub for now
   * (see Section 12 fast-follow) — the DB feed is the source of truth.
   */
  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        sentAt: new Date(),
      },
    });
    this.logger.debug(`Notification queued for user ${input.userId}: ${input.title}`);
    return notification;
  }

  /**
   * Fan-out helper (e.g. notifying every college admin about a new report).
   * Uses a single INSERT instead of N round-trips. Returns nothing — callers
   * that need the rows should use create() per-user.
   */
  async createMany(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return { count: 0 };
    const now = new Date();
    const result = await this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        sentAt: now,
      })),
    });
    this.logger.debug(`Queued ${result.count} notifications`);
    return result;
  }

  async findForUser(userId: string, query: QueryNotificationsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.unreadOnly) where.isRead = false;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
