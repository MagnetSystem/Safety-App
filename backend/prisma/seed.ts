import { PrismaClient, Student } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

async function hash(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main() {
  // --- Super Admin -----------------------------------------------------------
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@campussafety.dev';
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';

  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: await hash(superAdminPassword),
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Super Admin ready: ${superAdminEmail} / ${superAdminPassword}`);

  // --- Colleges ----------------------------------------------------------------
  const college = await prisma.college.upsert({
    where: { code: 'GEC-DEMO' },
    update: {},
    create: {
      name: 'Government Engineering College (Demo)',
      code: 'GEC-DEMO',
      address: '123 College Road',
      state: 'Tamil Nadu',
      district: 'Chennai',
      principal: 'Dr. A. Principal',
      phone: '+91-9800000000',
      email: 'principal@gec-demo.edu',
      status: 'ACTIVE',
    },
  });

  // --- College Admin -------------------------------------------------------------
  const adminEmail = 'admin@gec-demo.edu';
  const adminPassword = 'ChangeMe123!';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: 'COLLEGE_ADMIN',
      collegeAdmin: {
        create: { name: 'Anti-Ragging Committee Head', phone: '+91-9800000001', collegeId: college.id },
      },
    },
  });
  console.log(`College Admin ready: ${adminEmail} / ${adminPassword}`);

  // --- Students ------------------------------------------------------------------
  const studentsSeed = [
    { email: 'aditi.sharma@gec-demo.edu', name: 'Aditi Sharma', studentNumber: 'GEC21CS001', department: 'Computer Science', course: 'B.Tech', year: 2 },
    { email: 'rahul.verma@gec-demo.edu', name: 'Rahul Verma', studentNumber: 'GEC21ME014', department: 'Mechanical', course: 'B.Tech', year: 3 },
    { email: 'priya.nair@gec-demo.edu', name: 'Priya Nair', studentNumber: 'GEC22EC022', department: 'Electronics', course: 'B.Tech', year: 1 },
  ];

  const students: Student[] = [];
  for (const s of studentsSeed) {
    const password = 'ChangeMe123!';
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: await hash(password),
        role: 'STUDENT',
        student: {
          create: {
            name: s.name,
            collegeId: college.id,
            studentNumber: s.studentNumber,
            department: s.department,
            course: s.course,
            year: s.year,
            isHosteler: true,
            bloodGroup: 'O+',
          },
        },
      },
    });
    const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id } });
    students.push(student);
  }
  console.log(`Seeded ${students.length} students (password for all: ChangeMe123!)`);

  // --- Sample complaints ----------------------------------------------------------
  const existingComplaints = await prisma.complaint.count({ where: { collegeId: college.id } });
  if (existingComplaints === 0) {
    await prisma.complaint.create({
      data: {
        code: `CS-${new Date().getFullYear()}-SEED01`,
        collegeId: college.id,
        studentId: students[0].id,
        type: 'NORMAL',
        category: 'VERBAL_ABUSE',
        status: 'UNDER_REVIEW',
        priority: 'NORMAL',
        description: 'Seniors have been repeatedly verbally harassing juniors near the hostel mess.',
        location: 'Boys Hostel Block C',
        timeline: {
          create: [
            { status: 'SUBMITTED', note: 'Report submitted' },
            { status: 'UNDER_REVIEW', note: 'Assigned to committee' },
          ],
        },
      },
    });

    await prisma.complaint.create({
      data: {
        code: `CS-${new Date().getFullYear()}-SEED02`,
        collegeId: college.id,
        studentId: students[1].id,
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

    await prisma.complaint.create({
      data: {
        code: `CS-${new Date().getFullYear()}-SEED03`,
        collegeId: college.id,
        studentId: students[2].id,
        type: 'ANONYMOUS',
        isAnonymous: true,
        category: 'MENTAL_HARASSMENT',
        status: 'SUBMITTED',
        priority: 'NORMAL',
        description: 'A group in my class has been isolating and mocking a first-year student daily.',
        timeline: { create: [{ status: 'SUBMITTED', note: 'Report submitted' }] },
      },
    });
    console.log('Seeded 3 sample complaints (normal, emergency, anonymous)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
