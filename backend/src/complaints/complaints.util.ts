/**
 * A College Admin (and everyone else, per the platform's anonymity guarantee) must
 * never see who filed an Anonymous report. The internal studentId is kept on the row
 * for anti-spam / safe-follow-up purposes only and is stripped from every API response.
 */
export function maskAnonymousComplaint<T extends { isAnonymous: boolean; studentId?: string | null; student?: unknown }>(
  complaint: T,
) {
  if (!complaint.isAnonymous) {
    return { ...complaint, reporterLabel: (complaint as any).student?.name ?? null };
  }
  const { studentId, student, ...rest } = complaint as any;
  return { ...rest, reporterLabel: 'Anonymous Student' };
}
