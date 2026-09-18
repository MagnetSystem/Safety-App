import type { ProfileFieldDef, StudentProfile } from '../types';

/** Used when a member has no organization (or its field defs haven't loaded) — the bare minimum for Emergency SOS. */
export const FALLBACK_PROFILE_FIELDS: ProfileFieldDef[] = [
  { key: 'mobile', label: 'Mobile number', type: 'tel', group: 'identity', required: true },
  { key: 'emergencyContactName', label: 'Emergency contact name', type: 'text', group: 'emergency', required: true },
  { key: 'emergencyContactPhone', label: 'Emergency contact phone', type: 'tel', group: 'emergency', required: true },
];

/** A guardian-only account never files reports or triggers its own SOS — it just needs to be
 *  reachable, so Complete Profile only asks for a mobile number instead of the full member form. */
export const GUARDIAN_PROFILE_FIELDS: ProfileFieldDef[] = [
  { key: 'mobile', label: 'Mobile number', type: 'tel', group: 'identity', required: true },
];

type GuardianCheckProfile = Pick<StudentProfile, 'organizationId' | 'college' | 'profile'>;

/** True only for an account that explicitly signed up as Guardian and has no organization —
 *  see AuthContext's isGuardianOnly for why this can't be inferred from "no org" alone. */
export function isGuardianOnlyProfile(profile: GuardianCheckProfile): boolean {
  const accountPurpose = profile.profile?.accountPurpose as string | undefined;
  const hasOrg = !!(profile.organizationId || profile.college?.id);
  return accountPurpose === 'guardian' && !hasOrg;
}

/**
 * The field set a member is expected to fill, resolved the same way for every screen that renders or
 * checks it. An org's own `settings.profileFieldDefs` (its customized copy, editable by the owner from
 * Settings) takes priority over the shared `organizationType.memberFields` template, so a customization
 * actually takes effect instead of being silently overridden by the template.
 */
export function resolveMemberFields(
  profile: Pick<StudentProfile, 'organization'> & GuardianCheckProfile,
): ProfileFieldDef[] {
  if (isGuardianOnlyProfile(profile)) return GUARDIAN_PROFILE_FIELDS;
  const defs =
    profile.organization?.settings?.profileFieldDefs ??
    profile.organization?.organizationType?.memberFields ??
    FALLBACK_PROFILE_FIELDS;
  const usable = defs.filter((f) => f.key !== 'name');
  return usable.length ? usable : FALLBACK_PROFILE_FIELDS;
}

/** True once every required field for this member's organization has a value (column or profile blob). */
export function isProfileComplete(profile: StudentProfile): boolean {
  const fields = resolveMemberFields(profile);
  const values = valuesFromProfile(fields, profile as unknown as Record<string, unknown>);
  return fields.every((f) => !f.required || values[f.key].trim().length > 0);
}

/**
 * Columns the backend stores directly on the member row (see UpdateMemberProfileDto).
 * Anything else goes into the free-form `profile` JSON blob instead.
 */
export const PROFILE_COLUMN_KEYS = new Set([
  'name', 'mobile', 'dateOfBirth', 'gender', 'studentNumber',
  'department', 'course', 'semester', 'year', 'section', 'isHosteler',
  'hostelAddress', 'hostelRoomNumber', 'permanentAddress',
  'emergencyContactName', 'emergencyContactPhone', 'bloodGroup',
  'medicalConditions', 'allergies', 'disability',
]);

/** The backend requires an ISO 8601 date (YYYY-MM-DD) — anything else is rejected. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** As the user types digits, auto-inserts dashes so the result is always YYYY-MM-DD. */
export function maskIsoDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('-');
}

export function fieldHint(field: ProfileFieldDef): string | undefined {
  if (field.help) return field.help;
  switch (field.type) {
    case 'date':
      return 'Format: YYYY-MM-DD, e.g. 2003-05-14';
    case 'tel':
      return 'Numbers only, e.g. 9876543210';
    case 'email':
      return 'e.g. name@example.com';
    default:
      return undefined;
  }
}

/** Reads each field's current value off a profile object, checking the direct column first, then the `profile` JSON blob. */
export function valuesFromProfile(fields: ProfileFieldDef[], profile: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  const extra = (profile.profile as Record<string, unknown> | undefined) ?? {};
  for (const f of fields) {
    const raw = profile[f.key] ?? extra[f.key] ?? '';
    let value = raw === true ? 'true' : raw === false ? 'false' : String(raw ?? '');
    // Backend may return dateOfBirth as a full ISO datetime — keep only the date part.
    if (f.type === 'date' && value) value = value.slice(0, 10);
    next[f.key] = value;
  }
  return next;
}

/**
 * Splits form values into the backend's direct-column patch and its free-form `profile` blob,
 * mapping the industry-specific `memberNumber` field onto the real `studentNumber` column.
 */
export function buildProfilePatch(fields: ProfileFieldDef[], values: Record<string, string>) {
  const columnPatch: Record<string, unknown> = {};
  const profile: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = (values[f.key] ?? '').trim();
    let parsed: unknown = raw;
    if (f.type === 'number') parsed = raw ? Number(raw) : undefined;
    if (f.type === 'boolean') parsed = raw === 'true' || raw === '1';
    if (f.key === 'memberNumber') {
      columnPatch.studentNumber = raw;
    } else if (PROFILE_COLUMN_KEYS.has(f.key)) {
      columnPatch[f.key] = parsed;
    } else {
      profile[f.key] = parsed;
    }
  }
  return { columnPatch, profile };
}
