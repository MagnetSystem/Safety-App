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
  supportSession?: { organizationId: string; organizationName: string } | null;
}

const ROLE_MAP: Record<BackendRole, Exclude<Role, null> | null> = {
  MEMBER: null,
  GUARDIAN: null,
  STAFF: 'staff',
  ADMIN: 'admin',
  OWNER: 'owner',
  SUPPORT: 'support',
};

export function toAppRole(role: BackendRole | string): Exclude<Role, null> | null {
  return ROLE_MAP[role as BackendRole] ?? null;
}

export function isOrgDashboardRole(role: Role): boolean {
  return role === 'staff' || role === 'admin' || role === 'owner';
}
