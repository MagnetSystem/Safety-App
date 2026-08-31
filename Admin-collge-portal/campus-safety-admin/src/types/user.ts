export type BackendRole = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPER_ADMIN';
export type Role = 'college_admin' | 'super_admin' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  collegeId: string | null;
  collegeName?: string | null;
}

export function toAppRole(role: BackendRole): Exclude<Role, null> | null {
  if (role === 'COLLEGE_ADMIN') return 'college_admin';
  if (role === 'SUPER_ADMIN') return 'super_admin';
  return null;
}
