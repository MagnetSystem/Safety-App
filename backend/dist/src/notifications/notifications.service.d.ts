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
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(input: CreateNotificationInput): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: Prisma.JsonValue | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        sentAt: Date | null;
    }>;
    createMany(inputs: CreateNotificationInput[]): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: Prisma.JsonValue | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        sentAt: Date | null;
    }[]>;
    findForUser(userId: string, query: QueryNotificationsDto): Promise<Paginated<unknown>>;
    markRead(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: Prisma.JsonValue | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        sentAt: Date | null;
    }>;
    markAllRead(userId: string): Promise<{
        success: boolean;
    }>;
}
export {};
