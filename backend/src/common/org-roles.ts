import { OrgRole, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';

const ORG_RANK: Partial<Record<UserRole, number>> = {
  [UserRole.STAFF]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.OWNER]: 3,
};

/** Owner includes Admin includes Staff. Other roles match exactly. */
export function roleSatisfies(userRole: UserRole, required: UserRole): boolean {
  if (userRole === required) return true;
  const userRank = ORG_RANK[userRole];
  const requiredRank = ORG_RANK[required];
  if (userRank != null && requiredRank != null) return userRank >= requiredRank;
  return false;
}

export function isOrgOperator(role: UserRole): boolean {
  return role === UserRole.STAFF || role === UserRole.ADMIN || role === UserRole.OWNER;
}

export function canSeeAllOrgCases(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.role === UserRole.SUPPORT;
}

export function canManageStaff(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.OWNER;
}

export function canManageAdmins(user: AuthenticatedUser): boolean {
  return user.role === UserRole.OWNER;
}

export function orgRoleToUserRole(orgRole: OrgRole): UserRole {
  if (orgRole === OrgRole.OWNER) return UserRole.OWNER;
  if (orgRole === OrgRole.ADMIN) return UserRole.ADMIN;
  return UserRole.STAFF;
}
