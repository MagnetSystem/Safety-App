import type { Member, ProfileFieldDef } from '../types/organization';

/** Used when a member has no organization (or its field defs haven't loaded). */
export const FALLBACK_PROFILE_FIELDS: ProfileFieldDef[] = [
  { key: 'mobile', label: 'Mobile number', type: 'tel', group: 'identity' },
  { key: 'emergencyContactName', label: 'Emergency contact name', type: 'text', group: 'emergency' },
  { key: 'emergencyContactPhone', label: 'Emergency contact phone', type: 'tel', group: 'emergency' },
];

/** The field set a member's organization asks for — same schema the member-app renders and saves against. */
export function resolveMemberFields(member: Member): ProfileFieldDef[] {
  const defs =
    member.organization?.organizationType?.memberFields ??
    member.organization?.settings?.profileFieldDefs ??
    FALLBACK_PROFILE_FIELDS;
  const usable = defs.filter((f) => f.key !== 'name');
  return usable.length ? usable : FALLBACK_PROFILE_FIELDS;
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
