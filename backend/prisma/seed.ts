import { PrismaClient, OrgRole, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { INDUSTRY_CATALOG, catalogFor, settingsFor } from '../src/common/industry';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

async function hash(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main() {
  await prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'true', false)`;

  const supportEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@campussafety.dev';
  const supportPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';

  await prisma.user.upsert({
    where: { email: supportEmail },
    update: { role: UserRole.SUPPORT },
    create: {
      email: supportEmail,
      passwordHash: await hash(supportPassword),
      role: UserRole.SUPPORT,
    },
  });
  console.log(`Support ready: ${supportEmail} / ${supportPassword}`);

  for (const catalog of Object.values(INDUSTRY_CATALOG)) {
    await prisma.organizationType.upsert({
      where: { slug: catalog.id },
      update: {},
      create: {
        slug: catalog.id,
        label: catalog.label,
        blurb: catalog.blurb,
        isSystem: true,
        isActive: true,
        features: catalog.features as object,
        categories: catalog.categories as object,
        defaultDepartments: catalog.defaultDepartments as object,
        orgSetupFields: catalog.orgSetupFields as object,
        memberFields: catalog.memberFields as object,
      },
    });
  }

  const educationType = await prisma.organizationType.findUnique({ where: { slug: 'EDUCATION' } });

  const organization = await prisma.organization.upsert({
    where: { code: 'GEC-DEMO' },
    update: {},
    create: {
      name: 'Government Engineering College (Demo)',
      code: 'GEC-DEMO',
      joinCode: 'DEMOJOIN',
      industry: 'EDUCATION',
      organizationTypeId: educationType?.id,
      address: '123 College Road',
      state: 'Tamil Nadu',
      district: 'Chennai',
      contactName: 'Dr. A. Principal',
      phone: '+91-9800000000',
      email: 'principal@gec-demo.edu',
      status: 'ACTIVE',
      settings: settingsFor('EDUCATION') as object,
    },
  });

  const deptCount = await prisma.department.count({ where: { organizationId: organization.id } });
  if (deptCount === 0) {
    const templates = catalogFor('EDUCATION').defaultDepartments;
    await prisma.department.createMany({
      data: templates.map((t, i) => ({
        organizationId: organization.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        isDefault: i === 0,
      })),
    });
  }

  const ownerEmail = 'admin@gec-demo.edu';
  const ownerPassword = 'ChangeMe123!';
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: UserRole.OWNER },
    create: {
      email: ownerEmail,
      passwordHash: await hash(ownerPassword),
      role: UserRole.OWNER,
    },
  });
  await prisma.orgStaff.upsert({
    where: { userId: owner.id },
    update: { orgRole: OrgRole.OWNER, name: 'Safety Owner', organizationId: organization.id },
    create: {
      userId: owner.id,
      name: 'Safety Owner',
      phone: '+91-9800000001',
      organizationId: organization.id,
      orgRole: OrgRole.OWNER,
    },
  });
  console.log(`Owner ready: ${ownerEmail} / ${ownerPassword}`);

  const staffEmail = 'staff@gec-demo.edu';
  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: { role: UserRole.STAFF },
    create: {
      email: staffEmail,
      passwordHash: await hash('ChangeMe123!'),
      role: UserRole.STAFF,
    },
  });
  await prisma.orgStaff.upsert({
    where: { userId: staff.id },
    update: { orgRole: OrgRole.STAFF, name: 'Campus Responder', organizationId: organization.id },
    create: {
      userId: staff.id,
      name: 'Campus Responder',
      phone: '+91-9800000002',
      organizationId: organization.id,
      orgRole: OrgRole.STAFF,
    },
  });
  console.log(`Staff ready: ${staffEmail} / ChangeMe123!`);

  const membersSeed = [
    { email: 'aditi.sharma@gec-demo.edu', name: 'Aditi Sharma', memberNumber: 'GEC21CS001', department: 'Computer Science', course: 'B.Tech', year: 2 },
    { email: 'rahul.verma@gec-demo.edu', name: 'Rahul Verma', memberNumber: 'GEC21ME014', department: 'Mechanical', course: 'B.Tech', year: 3 },
    { email: 'priya.nair@gec-demo.edu', name: 'Priya Nair', memberNumber: 'GEC22EC022', department: 'Electronics', course: 'B.Tech', year: 1 },
  ];

  const members: { id: string }[] = [];
  for (const s of membersSeed) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: await hash('ChangeMe123!'),
        role: UserRole.MEMBER,
        member: {
          create: {
            name: s.name,
            organizationId: organization.id,
            memberNumber: s.memberNumber,
            department: s.department,
            course: s.course,
            year: s.year,
            isHosteler: true,
            bloodGroup: 'O+',
          },
        },
      },
    });
    const member = await prisma.member.findUniqueOrThrow({ where: { userId: user.id } });
    members.push(member);
  }
  console.log(`Seeded ${members.length} members (password for all: ChangeMe123!)`);

  const existingIncidents = await prisma.incident.count({ where: { organizationId: organization.id } });
  if (existingIncidents === 0) {
    await prisma.incident.create({
      data: {
        code: `SP-${new Date().getFullYear()}-SEED01`,
        organizationId: organization.id,
        memberId: members[0].id,
        type: 'NORMAL',
        category: 'VERBAL_ABUSE',
        status: 'UNDER_REVIEW',
        priority: 'NORMAL',
        description: 'Seniors have been repeatedly verbally harassing juniors near the hostel mess.',
        location: 'Boys Hostel Block C',
        timeline: {
          create: [
            { status: 'SUBMITTED', note: 'Report submitted' },
            { status: 'UNDER_REVIEW', note: 'Assigned to staff' },
          ],
        },
      },
    });

    await prisma.incident.create({
      data: {
        code: `SP-${new Date().getFullYear()}-SEED02`,
        organizationId: organization.id,
        memberId: members[1].id,
        type: 'EMERGENCY',
        category: 'THREAT',
        status: 'INVESTIGATING',
        priority: 'CRITICAL',
        description: 'Being followed and threatened by a group of seniors right now.',
        gpsLat: 13.0827,
        gpsLng: 80.2707,
        gpsAccuracy: 12.5,
        timeline: {
          create: [
            { status: 'SUBMITTED', note: 'Emergency report submitted' },
            { status: 'INVESTIGATING', note: 'Security dispatched, investigation started' },
          ],
        },
      },
    });

    await prisma.incident.create({
      data: {
        code: `SP-${new Date().getFullYear()}-SEED03`,
        organizationId: organization.id,
        memberId: members[2].id,
        type: 'ANONYMOUS',
        isAnonymous: true,
        category: 'MENTAL_HARASSMENT',
        status: 'SUBMITTED',
        priority: 'NORMAL',
        description: 'A group in my class has been isolating and mocking a first-year student daily.',
        timeline: { create: [{ status: 'SUBMITTED', note: 'Report submitted' }] },
      },
    });
    console.log('Seeded 3 sample incidents (normal, emergency, anonymous)');
  }

  console.log(`Organization join code: ${organization.joinCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
