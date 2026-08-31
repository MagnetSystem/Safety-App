import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';

const RESULT_LIMIT = 20;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Super Admin searches the whole platform; College Admin is always scoped
   * to their own college — enforced here, not left to the caller.
   */
  async search(user: AuthenticatedUser, q: string) {
    const collegeScope: Prisma.StudentWhereInput = user.role === 'COLLEGE_ADMIN' ? { collegeId: user.collegeId! } : {};
    const complaintCollegeScope: Prisma.ComplaintWhereInput =
      user.role === 'COLLEGE_ADMIN' ? { collegeId: user.collegeId! } : {};

    const [students, complaints, colleges] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          ...collegeScope,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { studentNumber: { contains: q, mode: 'insensitive' } },
            { mobile: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: RESULT_LIMIT,
        select: {
          id: true,
          name: true,
          studentNumber: true,
          college: { select: { id: true, name: true } },
          user: { select: { email: true } },
        },
      }),
      this.prisma.complaint.findMany({
        where: { ...complaintCollegeScope, code: { contains: q, mode: 'insensitive' } },
        take: RESULT_LIMIT,
        select: { id: true, code: true, status: true, type: true, category: true, collegeId: true },
      }),
      user.role === 'SUPER_ADMIN'
        ? this.prisma.college.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { code: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: RESULT_LIMIT,
          })
        : Promise.resolve([]),
    ]);

    return { students, complaints, colleges };
  }
}
