import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { Paginated } from '../common/dto/pagination.dto';

const PROFILE_INCLUDE = {
  user: { select: { id: true, email: true, isActive: true, createdAt: true } },
  college: { select: { id: true, name: true, code: true } },
} as const;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(requester: AuthenticatedUser, query: QueryStudentsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.StudentWhereInput = {};

    if (requester.role === 'COLLEGE_ADMIN') {
      where.collegeId = requester.collegeId!;
    } else if (query.collegeId) {
      where.collegeId = query.collegeId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { studentNumber: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PROFILE_INCLUDE,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOneForRequester(requester: AuthenticatedUser, id: string) {
    const student = await this.prisma.student.findUnique({ where: { id }, include: PROFILE_INCLUDE });
    if (!student) throw new NotFoundException('Student not found');

    if (requester.role === 'COLLEGE_ADMIN' && student.collegeId !== requester.collegeId) {
      throw new ForbiddenException('This student belongs to a different college');
    }
    return student;
  }

  async findMe(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async updateMe(userId: string, dto: UpdateStudentProfileDto) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    return this.prisma.student.update({
      where: { userId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: PROFILE_INCLUDE,
    });
  }

  /** Everything we hold about this student, as a single JSON document. */
  async exportMe(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true, createdAt: true } },
        college: { select: { name: true, code: true } },
        complaints: {
          orderBy: { createdAt: 'asc' },
          include: {
            timeline: { orderBy: { createdAt: 'asc' } },
            messages: { orderBy: { createdAt: 'asc' } },
            evidence: { select: { fileName: true, type: true, createdAt: true } },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { type: true, title: true, body: true, isRead: true, createdAt: true },
    });

    return {
      exportedAt: new Date().toISOString(),
      account: student.user,
      college: student.college,
      profile: student,
      notifications,
    };
  }

  /**
   * Hard-deletes the student's account. Their reports are kept for the
   * committee's records but detached (studentId set to null), so nothing
   * personally identifies them any more.
   */
  async deleteMe(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    await this.prisma.$transaction([
      this.prisma.complaint.updateMany({
        where: { studentId: student.id },
        data: { studentId: null },
      }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  }
}
