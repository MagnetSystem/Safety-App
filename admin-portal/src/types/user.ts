export type BackendRole = 'MEMBER' | 'GUARDIAN' | 'STAFF' | 'ADMIN' | 'OWNER' | 'SUPPORT';
export type Role = 'staff' | 'admin' | 'owner' | 'support' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
  organizationName?: string | null;
  /** @deprecated */
  collegeId: string | null;
  collegeName?: string | null;
}

const ROLE_MAP: Record<BackendRole, Exclude<Role, null> | null> = {
  MEMBER: null,
  GUARDIAN: null,
  STAFF: 'staff',
  ADMIN: 'admin',
  OWNER: 'owner',
  SUPPORT: 'support',
};

export function toAppRole(role: BackendRole | string | null | undefined): Exclude<Role, null> | null {
  if (!role) return null;
  return ROLE_MAP[String(role).trim().toUpperCase() as BackendRole] ?? null;
}

const ORG_RANK: Record<Exclude<Role, null>, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
  support: 0,
};

/** Prefer the higher of users.role and orgStaff.orgRole so owners are not downgraded. */
export function resolveOrgAppRole(
  userRole?: string | null,
  orgRole?: string | null,
): Exclude<Role, null> | null {
  const fromUser = toAppRole(userRole);
  const fromOrg = toAppRole(orgRole);
  if (fromUser && fromOrg) {
    return (ORG_RANK[fromOrg] ?? 0) >= (ORG_RANK[fromUser] ?? 0) ? fromOrg : fromUser;
  }
  return fromOrg ?? fromUser;
}

export function isOrgDashboardRole(role: Role): boolean {
  const appRole = toAppRole(role) ?? role;
  return appRole === 'staff' || appRole === 'admin' || appRole === 'owner';
}

/** Owners and admins can add/manage organization staff. */
export function canManageOrgTeam(role: Role | string | null | undefined): boolean {
  const appRole = toAppRole(role);
  return appRole === 'owner' || appRole === 'admin';
}

/** Only the organization owner can create admin accounts. */
export function canAddOrgAdmins(role: Role | string | null | undefined): boolean {
  return toAppRole(role) === 'owner';
}
