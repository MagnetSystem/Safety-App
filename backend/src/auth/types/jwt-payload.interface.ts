import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  /** @deprecated alias of organizationId for older clients */
  collegeId: string | null;
  memberId?: string | null;
  orgStaffId?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  /** @deprecated alias of organizationId */
  collegeId: string | null;
  memberId?: string | null;
  orgStaffId?: string | null;
}
