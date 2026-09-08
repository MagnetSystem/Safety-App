import { createHash, randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateInviteCode(): string {
  return generateJoinCode(8);
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function slugCodeFromName(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 12);
  return `${slug || 'ORG'}-${generateJoinCode(4)}`;
}
