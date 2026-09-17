import type { Member, Organization, ProfileFieldDef } from '../types/organization';

/** Used when a member has no organization (or its field defs haven't loaded). */
export const FALLBACK_PROFILE_FIELDS: ProfileFieldDef[] = [
  { key: 'mobile', label: 'Mobile number', type: 'tel', group: 'identity' },
  { key: 'emergencyContactName', label: 'Emergency contact name', type: 'text', group: 'emergency' },
  { key: 'emergencyContactPhone', label: 'Emergency contact phone', type: 'tel', group: 'emergency' },
];

/**
 * The field set an org asks its members to fill — same schema the member-app renders and saves against.
 * An org's own `settings.profileFieldDefs` (its customized copy, seeded from the type template at
 * creation and editable from Settings) takes priority over the shared `organizationType.memberFields`
 * template, so an owner's customization actually takes effect instead of being silently overridden.
 */
export function resolveOrgMemberFields(org?: Organization | null): ProfileFieldDef[] {
  const defs = org?.settings?.profileFieldDefs ?? org?.organizationType?.memberFields ?? FALLBACK_PROFILE_FIELDS;
  const usable = defs.filter((f) => f.key !== 'name');
  return usable.length ? usable : FALLBACK_PROFILE_FIELDS;
}

export function resolveMemberFields(member: Member): ProfileFieldDef[] {
  return resolveOrgMemberFields(member.organization as Organization | undefined);
}

/** Reads a field's value off the member — direct column first, then the free-form `profile` JSON blob. */
export function memberFieldValue(member: Member, field: ProfileFieldDef): string {
  const record = member as unknown as Record<string, unknown>;
  const raw = record[field.key === 'memberNumber' ? 'memberNumber' : field.key] ?? member.profile?.[field.key];
  if (raw === null || raw === undefined || raw === '') return '';
  if (raw === true) return 'Yes';
  if (raw === false) return 'No';
  return String(raw);
}

/** The single most identifying "role" field for a compact table column — e.g. Course, Job title, Care level. */
export function pickRoleField(fields: ProfileFieldDef[]): ProfileFieldDef | undefined {
  const roleFields = fields.filter((f) => f.group === 'role' && f.key !== 'memberNumber');
  return roleFields.find((f) => f.required) ?? roleFields[0];
}

/** The field used as this org's member identifier — roll number, employee ID, resident ID, etc. */
export function pickIdField(fields: ProfileFieldDef[]): ProfileFieldDef {
  return fields.find((f) => f.key === 'memberNumber') ?? { key: 'memberNumber', label: 'Member ID', type: 'text', group: 'role' };
}

export const FIELD_GROUP_LABELS: Record<string, string> = {
  identity: 'Identity',
  role: 'Role',
  location: 'Location',
  emergency: 'Emergency contact',
  medical: 'Medical',
  organization: 'Organization',
};

/** Groups an owner can pick when adding/editing a member field — "organization" is a setup-time-only group. */
export const EDITABLE_FIELD_GROUPS = ['identity', 'role', 'location', 'emergency', 'medical'] as const;

export const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  tel: 'Phone number',
  email: 'Email',
  number: 'Number',
  select: 'Choice (dropdown)',
  boolean: 'Yes / No',
  date: 'Date',
};

export const EDITABLE_FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as (keyof typeof FIELD_TYPE_LABELS)[];

/** Turns a label into a stable, unique field key, e.g. "Scholarship ID" -> "scholarshipId". */
export function slugifyFieldKey(label: string, existingKeys: Set<string>): string {
  const base = label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join('') || 'field';
  let key = base;
  let suffix = 2;
  while (existingKeys.has(key)) {
    key = `${base}${suffix}`;
    suffix += 1;
  }
  return key;
}

export function groupFields(fields: ProfileFieldDef[]): { group: string; label: string; fields: ProfileFieldDef[] }[] {
  const order = ['identity', 'role', 'location', 'emergency', 'medical', 'organization'];
  const byGroup = new Map<string, ProfileFieldDef[]>();
  for (const f of fields) {
    if (!byGroup.has(f.group)) byGroup.set(f.group, []);
    byGroup.get(f.group)!.push(f);
  }
  return order
    .filter((g) => byGroup.has(g))
    .map((g) => ({ group: g, label: FIELD_GROUP_LABELS[g] ?? g, fields: byGroup.get(g)! }));
}
