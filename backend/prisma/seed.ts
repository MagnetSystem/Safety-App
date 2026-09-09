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

  await seedVolume(organization.id, owner.id, members);
}

async function seedVolume(
  gecOrgId: string,
  gecOwnerUserId: string,
  gecMembers: { id: string }[],
) {
  const passwordHash = await hash('ChangeMe123!');
  const types = await prisma.organizationType.findMany();
  const typeBySlug = Object.fromEntries(types.map((t) => [t.slug, t.id]));

  const extraOrgs = [
    { name: 'Anna University Regional Campus', code: 'AU-CBE', industry: 'EDUCATION', state: 'Tamil Nadu', district: 'Coimbatore', status: 'ACTIVE' as const },
    { name: 'NIT Calicut Safety Cell', code: 'NIT-CLT', industry: 'EDUCATION', state: 'Kerala', district: 'Kozhikode', status: 'ACTIVE' as const },
    { name: 'IIT Madras Hostels', code: 'IITM-HST', industry: 'EDUCATION', state: 'Tamil Nadu', district: 'Chennai', status: 'ACTIVE' as const },
    { name: 'VIT Vellore Campus Safety', code: 'VIT-VLR', industry: 'EDUCATION', state: 'Tamil Nadu', district: 'Vellore', status: 'ACTIVE' as const },
    { name: 'PSG College of Technology', code: 'PSG-TECH', industry: 'EDUCATION', state: 'Tamil Nadu', district: 'Coimbatore', status: 'ACTIVE' as const },
    { name: 'Christ University Bangalore', code: 'CHRIST-BLR', industry: 'EDUCATION', state: 'Karnataka', district: 'Bengaluru', status: 'ACTIVE' as const },
    { name: 'Jadavpur University', code: 'JU-KOL', industry: 'EDUCATION', state: 'West Bengal', district: 'Kolkata', status: 'ACTIVE' as const },
    { name: 'Delhi Technological University', code: 'DTU-DEL', industry: 'EDUCATION', state: 'Delhi', district: 'New Delhi', status: 'ACTIVE' as const },
    { name: 'BITS Pilani Campus', code: 'BITS-PIL', industry: 'EDUCATION', state: 'Rajasthan', district: 'Pilani', status: 'ACTIVE' as const },
    { name: 'Amrita School of Engineering', code: 'AMRITA-CBE', industry: 'EDUCATION', state: 'Tamil Nadu', district: 'Coimbatore', status: 'SUSPENDED' as const },
    { name: 'Infosys Mysore Campus', code: 'INFY-MYS', industry: 'CORPORATE', state: 'Karnataka', district: 'Mysuru', status: 'ACTIVE' as const },
    { name: 'TCS Siruseri', code: 'TCS-CHN', industry: 'CORPORATE', state: 'Tamil Nadu', district: 'Chennai', status: 'ACTIVE' as const },
    { name: 'Wipro Electronic City', code: 'WIPRO-BLR', industry: 'CORPORATE', state: 'Karnataka', district: 'Bengaluru', status: 'ACTIVE' as const },
    { name: 'Zoho Estancia', code: 'ZOHO-CHN', industry: 'CORPORATE', state: 'Tamil Nadu', district: 'Chengalpattu', status: 'ACTIVE' as const },
    { name: 'Freshworks Chennai HQ', code: 'FW-CHN', industry: 'CORPORATE', state: 'Tamil Nadu', district: 'Chennai', status: 'ACTIVE' as const },
    { name: 'Reliance Jamnagar Refinery', code: 'RIL-JAM', industry: 'CORPORATE', state: 'Gujarat', district: 'Jamnagar', status: 'ACTIVE' as const },
    { name: 'Tata Steel Jamshedpur', code: 'TATA-JAM', industry: 'CORPORATE', state: 'Jharkhand', district: 'Jamshedpur', status: 'SUSPENDED' as const },
    { name: 'Sunrise Senior Living', code: 'SUN-PUN', industry: 'CARE_HOME', state: 'Maharashtra', district: 'Pune', status: 'ACTIVE' as const },
    { name: 'Apollo Elder Care Adyar', code: 'APC-ADY', industry: 'CARE_HOME', state: 'Tamil Nadu', district: 'Chennai', status: 'ACTIVE' as const },
    { name: 'Nightingales Centre Bengaluru', code: 'NGT-BLR', industry: 'CARE_HOME', state: 'Karnataka', district: 'Bengaluru', status: 'ACTIVE' as const },
    { name: 'Kauvery Care Trichy', code: 'KVR-TRY', industry: 'CARE_HOME', state: 'Tamil Nadu', district: 'Tiruchirappalli', status: 'ACTIVE' as const },
    { name: 'Helpage India Home Kochi', code: 'HLP-COK', industry: 'CARE_HOME', state: 'Kerala', district: 'Ernakulam', status: 'ACTIVE' as const },
    { name: 'City General Hospital Safety', code: 'CGH-HYD', industry: 'CUSTOM', state: 'Telangana', district: 'Hyderabad', status: 'ACTIVE' as const },
    { name: 'Metro Rail Operations Chennai', code: 'CMRL-OPS', industry: 'CUSTOM', state: 'Tamil Nadu', district: 'Chennai', status: 'SUSPENDED' as const },
  ];

  for (const [i, org] of extraOrgs.entries()) {
    const row = await prisma.organization.upsert({
      where: { code: org.code },
      update: { status: org.status, name: org.name },
      create: {
        name: org.name,
        code: org.code,
        joinCode: `JOIN${org.code.replace(/[^A-Z0-9]/g, '').slice(0, 6)}${i}`,
        industry: org.industry,
        organizationTypeId: typeBySlug[org.industry],
        address: `${10 + i} Safety Avenue`,
        state: org.state,
        district: org.district,
        contactName: `Safety Lead ${i + 1}`,
        phone: `+91-98${String(10000000 + i).slice(0, 8)}`,
        email: `safety@${org.code.toLowerCase()}.org`,
        status: org.status,
        settings: settingsFor(org.industry) as object,
      },
    });

    const deptCount = await prisma.department.count({ where: { organizationId: row.id } });
    if (deptCount === 0) {
      const templates = catalogFor(org.industry).defaultDepartments;
      if (templates.length) {
        await prisma.department.createMany({
          data: templates.map((t, di) => ({
            organizationId: row.id,
            name: t.name,
            slug: t.slug,
            description: t.description,
            isDefault: di === 0,
          })),
        });
      }
    }

    const ownerEmail = `owner@${org.code.toLowerCase()}.org`;
    const ownerUser = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { role: UserRole.OWNER },
      create: { email: ownerEmail, passwordHash, role: UserRole.OWNER },
    });
    await prisma.orgStaff.upsert({
      where: { userId: ownerUser.id },
      update: { organizationId: row.id, orgRole: OrgRole.OWNER, name: `${org.name.split(' ')[0]} Owner` },
      create: {
        userId: ownerUser.id,
        organizationId: row.id,
        orgRole: OrgRole.OWNER,
        name: `${org.name.split(' ')[0]} Owner`,
        phone: `+91-97${String(20000000 + i).slice(0, 8)}`,
      },
    });

    const adminEmail = `admin@${org.code.toLowerCase()}.org`;
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: UserRole.ADMIN },
      create: { email: adminEmail, passwordHash, role: UserRole.ADMIN },
    });
    await prisma.orgStaff.upsert({
      where: { userId: adminUser.id },
      update: { organizationId: row.id, orgRole: OrgRole.ADMIN, name: `${org.name.split(' ')[0]} Admin` },
      create: {
        userId: adminUser.id,
        organizationId: row.id,
        orgRole: OrgRole.ADMIN,
        name: `${org.name.split(' ')[0]} Admin`,
      },
    });

    for (let m = 0; m < 6; m++) {
      const email = `member${m + 1}@${org.code.toLowerCase()}.org`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          role: UserRole.MEMBER,
          member: {
            create: {
              name: `${org.district} Member ${m + 1}`,
              organizationId: row.id,
              memberNumber: `${org.code}-${String(m + 1).padStart(3, '0')}`,
              department: m % 2 === 0 ? 'Operations' : 'Facilities',
              mobile: `+91-90${String(30000000 + i * 10 + m).slice(0, 8)}`,
              isHosteler: m % 3 === 0,
              bloodGroup: ['O+', 'A+', 'B+', 'AB+'][m % 4],
            },
          },
        },
      });
      const member = await prisma.member.findUnique({ where: { userId: user.id } });
      if (!member) continue;
      const incidentCount = await prisma.incident.count({ where: { organizationId: row.id, memberId: member.id } });
      if (incidentCount === 0 && m < 3) {
        const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;
        await prisma.incident.create({
          data: {
            code: `SP-${new Date().getFullYear()}-${org.code.slice(0, 4)}${m + 1}`,
            organizationId: row.id,
            memberId: member.id,
            type: m === 0 ? 'EMERGENCY' : m === 1 ? 'ANONYMOUS' : 'NORMAL',
            isAnonymous: m === 1,
            category: ['THREAT', 'VERBAL_ABUSE', 'CYBER_BULLYING'][m],
            status: statuses[m % statuses.length],
            priority: m === 0 ? 'CRITICAL' : 'NORMAL',
            description: `Demo case ${m + 1} at ${org.name}. Used to populate lists, filters, and dashboards.`,
            location: `${org.district} Block ${m + 1}`,
            timeline: { create: [{ status: 'SUBMITTED', note: 'Report submitted' }] },
          },
        });
      }
    }
  }
  console.log(`Showcase orgs ready: ${extraOrgs.length} extra organizations`);

  const extraPeople = [
    ['Kavya Iyer', 'Computer Science', 'B.Tech', 2],
    ['Arjun Menon', 'Mechanical', 'B.Tech', 3],
    ['Sneha Reddy', 'Electronics', 'B.Tech', 1],
    ['Mohammed Irfan', 'Civil', 'B.Tech', 4],
    ['Diya Krishnan', 'Computer Science', 'B.Tech', 2],
    ['Vikram Singh', 'Electrical', 'B.Tech', 3],
    ['Ananya Bose', 'Biotechnology', 'B.Tech', 1],
    ['Rohan Gupta', 'Mechanical', 'B.Tech', 2],
    ['Meera Nair', 'Architecture', 'B.Arch', 3],
    ['Siddharth Rao', 'Computer Science', 'M.Tech', 1],
    ['Fatima Sheikh', 'Electronics', 'B.Tech', 4],
    ['Nikhil Joshi', 'Chemical', 'B.Tech', 2],
    ['Pooja Desai', 'Computer Science', 'B.Tech', 3],
    ['Karthik Subramanian', 'Mechanical', 'B.Tech', 1],
    ['Ishita Malhotra', 'Civil', 'B.Tech', 2],
    ['Aditya Kulkarni', 'Electronics', 'B.Tech', 3],
    ['Nandini Pillai', 'Computer Science', 'B.Tech', 4],
    ['Harsh Patel', 'Information Tech', 'B.Tech', 1],
    ['Lakshmi Venkatesh', 'Electrical', 'B.Tech', 2],
    ['Yash Agarwal', 'Mechanical', 'B.Tech', 3],
    ['Ritika Sharma', 'Computer Science', 'B.Tech', 1],
    ['Suresh Babu', 'Civil', 'B.Tech', 4],
    ['Anjali Thomas', 'Biotechnology', 'B.Tech', 2],
    ['Dev Patel', 'Electronics', 'B.Tech', 3],
    ['Shreya Iyer', 'Computer Science', 'B.Tech', 2],
    ['Manish Kumar', 'Mechanical', 'B.Tech', 1],
    ['Keerthi Raj', 'Information Tech', 'B.Tech', 4],
    ['Aamir Khan', 'Electrical', 'B.Tech', 3],
    ['Bhavya Reddy', 'Civil', 'B.Tech', 2],
    ['Gautam Nair', 'Computer Science', 'B.Tech', 1],
    ['Neha Kapoor', 'Electronics', 'B.Tech', 3],
    ['Pranav Iyer', 'Mechanical', 'B.Tech', 2],
    ['Tanya Singh', 'Architecture', 'B.Arch', 1],
    ['Varun Krishnan', 'Chemical', 'B.Tech', 4],
    ['Aishwarya Menon', 'Computer Science', 'B.Tech', 2],
    ['Rajat Verma', 'Information Tech', 'B.Tech', 3],
    ['Divya Suresh', 'Electronics', 'B.Tech', 1],
    ['Sanjay Pillai', 'Civil', 'B.Tech', 2],
    ['Harini Subramanian', 'Biotechnology', 'B.Tech', 3],
    ['Kiran Rao', 'Mechanical', 'B.Tech', 4],
  ] as const;

  const extraGecMembers: { id: string }[] = [...gecMembers];
  for (let i = 0; i < extraPeople.length; i++) {
    const [name, department, course, year] = extraPeople[i];
    const email = `${name.toLowerCase().replace(/ /g, '.')}@gec-demo.edu`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        role: UserRole.MEMBER,
        member: {
          create: {
            name,
            organizationId: gecOrgId,
            memberNumber: `GEC24${String(i + 10).padStart(3, '0')}`,
            department,
            course,
            year,
            section: ['A', 'B', 'C'][i % 3],
            isHosteler: i % 2 === 0,
            bloodGroup: ['O+', 'A+', 'B+', 'AB+', 'O-'][i % 5],
            mobile: `+91-95${String(40000000 + i).slice(0, 8)}`,
          },
        },
      },
    });
    const member = await prisma.member.findUnique({ where: { userId: user.id } });
    if (member) extraGecMembers.push(member);
  }

  const extraStaff = [
    { email: 'admin.hostel@gec-demo.edu', name: 'Hostel Admin', role: UserRole.ADMIN, orgRole: OrgRole.ADMIN },
    { email: 'admin.academic@gec-demo.edu', name: 'Academic Admin', role: UserRole.ADMIN, orgRole: OrgRole.ADMIN },
    { email: 'staff.security@gec-demo.edu', name: 'Night Security', role: UserRole.STAFF, orgRole: OrgRole.STAFF },
    { email: 'staff.counsel@gec-demo.edu', name: 'Student Counsellor', role: UserRole.STAFF, orgRole: OrgRole.STAFF },
    { email: 'staff.warden@gec-demo.edu', name: 'Hostel Warden', role: UserRole.STAFF, orgRole: OrgRole.STAFF },
    { email: 'staff.medical@gec-demo.edu', name: 'Campus Nurse', role: UserRole.STAFF, orgRole: OrgRole.STAFF },
  ] as const;
  for (const s of extraStaff) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { role: s.role },
      create: { email: s.email, passwordHash, role: s.role },
    });
    await prisma.orgStaff.upsert({
      where: { userId: user.id },
      update: { organizationId: gecOrgId, orgRole: s.orgRole, name: s.name },
      create: { userId: user.id, organizationId: gecOrgId, orgRole: s.orgRole, name: s.name },
    });
  }

  const categories = ['PHYSICAL_RAGGING', 'VERBAL_ABUSE', 'MENTAL_HARASSMENT', 'THREAT', 'HOSTEL_RAGGING', 'CLASSROOM_RAGGING', 'CYBER_BULLYING', 'SEXUAL_HARASSMENT', 'MONEY_EXTORTION', 'OTHER'];
  const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'MORE_INFO_REQUESTED', 'RESOLVED', 'CLOSED'] as const;
  const priorities = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const;
  const reportTypes = ['NORMAL', 'EMERGENCY', 'ANONYMOUS'] as const;
  const year = new Date().getFullYear();
  let createdCases = 0;
  for (let i = 0; i < 48; i++) {
    const code = `SP-${year}-GEC${String(i + 10).padStart(3, '0')}`;
    const exists = await prisma.incident.findUnique({ where: { code } });
    if (exists) continue;
    const member = extraGecMembers[i % extraGecMembers.length];
    const type = reportTypes[i % reportTypes.length];
    await prisma.incident.create({
      data: {
        code,
        organizationId: gecOrgId,
        memberId: member?.id,
        type,
        isAnonymous: type === 'ANONYMOUS',
        category: categories[i % categories.length],
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        description: `Showcase case ${i + 1}: ${categories[i % categories.length].toLowerCase().replace(/_/g, ' ')} reported from campus block ${(i % 8) + 1}.`,
        location: ['Boys Hostel Block C', 'Main Gate', 'Library steps', 'Canteen', 'Workshop', 'Auditorium', 'Girls Hostel', 'Parking lot'][i % 8],
        gpsLat: 13.08 + (i % 10) * 0.001,
        gpsLng: 80.27 + (i % 10) * 0.001,
        timeline: { create: [{ status: 'SUBMITTED', note: 'Report submitted' }] },
      },
    });
    createdCases += 1;
  }

  const existingNotes = await prisma.notification.count({ where: { userId: gecOwnerUserId } });
  if (existingNotes < 12) {
    await prisma.notification.createMany({
      data: [
        { userId: gecOwnerUserId, type: 'NEW_EMERGENCY_REPORT', title: 'Emergency near Main Gate', body: 'A critical SOS was filed 4 minutes ago.', isRead: false },
        { userId: gecOwnerUserId, type: 'NEW_COMPLAINT', title: 'New hostel case', body: 'Verbal abuse reported in Boys Hostel Block C.', isRead: false },
        { userId: gecOwnerUserId, type: 'STATUS_CHANGED', title: 'Case moved to investigating', body: 'SP seed case is now with campus security.', isRead: false },
        { userId: gecOwnerUserId, type: 'NEW_MESSAGE', title: 'Member replied', body: 'A reporter added more information to their case.', isRead: true },
        { userId: gecOwnerUserId, type: 'MORE_INFO_REQUESTED', title: 'Waiting on evidence', body: 'A staff member asked for photos from the canteen CCTV.', isRead: true },
        { userId: gecOwnerUserId, type: 'REPORT_CLOSED', title: 'Case closed', body: 'An extortion case was closed after counselling.', isRead: true },
        { userId: gecOwnerUserId, type: 'NEW_EVIDENCE_UPLOADED', title: 'Evidence uploaded', body: 'A voice note was attached to a harassment case.', isRead: false },
        { userId: gecOwnerUserId, type: 'GENERIC', title: 'Weekly safety digest', body: '12 open cases, 3 emergencies, 4 resolved this week.', isRead: true },
      ],
    });
  }

  console.log(`GEC showcase: ${extraGecMembers.length} members, +${createdCases} cases, extra staff, notifications`);
  console.log('All extra demo logins use password ChangeMe123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
