/**
 * Anonymous reports never expose the member's identity in API responses.
 * Also attaches legacy student/college field names so existing clients keep working.
 */
export function maskAnonymousComplaint(incident: any) {
  const member = incident.member;
  const legacy = {
    ...incident,
    studentId: incident.memberId ?? null,
    student: member ? { ...member, studentNumber: member.memberNumber ?? null } : null,
    collegeId: incident.organizationId ?? null,
    college: incident.organization ?? null,
    suspectedStudents: incident.suspectedPeople ?? null,
    assignedCommitteeUserIds: incident.assignedToUserId ? [incident.assignedToUserId] : [],
  };

  if (!incident.isAnonymous) {
    return { ...legacy, reporterLabel: member?.name ?? null };
  }

  return {
    ...legacy,
    memberId: undefined,
    member: undefined,
    studentId: null,
    student: null,
    reporterLabel: 'Anonymous',
  };
}
