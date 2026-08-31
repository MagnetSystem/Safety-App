import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findMine(user: AuthenticatedUser, query: QueryNotificationsDto): Promise<import("../common/dto/pagination.dto").Paginated<unknown>>;
    markRead(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        body: string;
        isRead: boolean;
        sentAt: Date | null;
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
}
