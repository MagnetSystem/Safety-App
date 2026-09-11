import { describe, expect, it } from 'vitest';
import { canManageOrgTeam, canAddOrgAdmins, isOrgDashboardRole, resolveOrgAppRole, toAppRole } from '../src/types/user';
import { readAuth, writeAuth, clearAuth } from '../src/lib/authStorage';

describe('portal permissions', () => {
  it.each(['staff', 'admin', 'owner'] as const)('%s can use the organization portal', role => expect(isOrgDashboardRole(role)).toBe(true));
  it('restricts team management and admin creation', () => {
    expect(canManageOrgTeam('staff')).toBe(false);
    expect(canManageOrgTeam('admin')).toBe(true);
    expect(canAddOrgAdmins('admin')).toBe(false);
    expect(canAddOrgAdmins('owner')).toBe(true);
    expect(isOrgDashboardRole('support')).toBe(false);
    expect(toAppRole('MEMBER')).toBeNull();
  });
  it('preserves support and the highest organization role', () => {
    expect(resolveOrgAppRole('SUPPORT', 'STAFF')).toBe('support');
    expect(resolveOrgAppRole('OWNER', 'STAFF')).toBe('owner');
    expect(resolveOrgAppRole('STAFF', 'ADMIN')).toBe('admin');
  });
});
describe('session storage', () => {
  it('moves tokens when remember-me changes and clears both stores on logout', () => {
    writeAuth({ accessToken: 'remembered', refreshToken: 'refresh' }, true);
    writeAuth({ accessToken: 'temporary', refreshToken: 'new-refresh' }, false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(readAuth('accessToken')).toBe('temporary');
    clearAuth();
    expect(readAuth('accessToken')).toBeNull();
    expect(readAuth('refreshToken')).toBeNull();
  });
});
