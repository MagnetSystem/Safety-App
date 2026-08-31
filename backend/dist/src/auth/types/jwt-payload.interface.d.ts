import { UserRole } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    collegeId: string | null;
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
    collegeId: string | null;
}
