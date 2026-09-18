import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Wipes every row of test/demo data while keeping the SUPPORT (super admin) account(s) intact,
 * so the platform can be tested from a clean slate. Deletes children before parents explicitly
 * rather than relying on DB-level cascade behavior, and keeps the system-seeded OrganizationType
 * catalog (Education/Corporate/Care Home/Custom) since that's app configuration, not test data.
 */
async function main() {
  await prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'true', false)`;

  const counts: Record<string, number> = {};
  const run = async (label: string, fn: () => Promise<{ count: number }>) => {
    const { count } = await fn();
    counts[label] = count;
  };

  await run('incidentEvidence', () => prisma.incidentEvidence.deleteMany());
  await run('incidentMessage', () => prisma.incidentMessage.deleteMany());
  await run('incidentTimeline', () => prisma.incidentTimeline.deleteMany());
  await run('incident', () => prisma.incident.deleteMany());
  await run('guardianLink', () => prisma.guardianLink.deleteMany());
  await run('departmentStaff', () => prisma.departmentStaff.deleteMany());
  await run('department', () => prisma.department.deleteMany());
  await run('notification', () => prisma.notification.deleteMany());
  await run('pushToken', () => prisma.pushToken.deleteMany());
  await run('passwordResetToken', () => prisma.passwordResetToken.deleteMany());
  await run('auditLog', () => prisma.auditLog.deleteMany());
  await run('member', () => prisma.member.deleteMany());
  await run('orgStaff', () => prisma.orgStaff.deleteMany());
  await run('organization', () => prisma.organization.deleteMany());
  await run('organizationType (custom)', () => prisma.organizationType.deleteMany({ where: { isSystem: false } }));
  await run('user (non-support)', () => prisma.user.deleteMany({ where: { role: { not: UserRole.SUPPORT } } }));

  console.log('Reset complete. Rows deleted:');
  for (const [label, count] of Object.entries(counts)) {
    console.log(`  ${label}: ${count}`);
  }

  const remainingUsers = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log('Remaining users:', remainingUsers);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
