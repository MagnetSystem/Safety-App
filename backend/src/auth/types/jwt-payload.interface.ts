import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId
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
