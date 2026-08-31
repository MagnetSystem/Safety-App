import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollegeAdminDto } from './dto/create-college-admin.dto';
import { UpdateCollegeAdminDto } from './dto/update-college-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryCollegeAdminsDto } from './dto/query-college-admins.dto';
import { Paginated } from '../common/dto/pagination.dto';

const BCRYPT_ROUNDS = 10;

const SAFE_SELECT = {
  id: true,
  name: true,
  phone: true,
  collegeId: true,
  college: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, email: true, isActive: true, createdAt: true } },
} as const;

@Injectable()
export class CollegeAdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCollegeAdminDto) {
    const college = await this.prisma.college.findUnique({ where: { id: dto.collegeId } });
    if (!college) throw new NotFoundException('College not found');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'COLLEGE_ADMIN',
        collegeAdmin: {
          create: { name: dto.name, phone: dto.phone, collegeId: dto.collegeId },
        },
      },
      include: { collegeAdmin: true },
    });

    return this.findOne(user.collegeAdmin!.id);
  }

  async findAll(query: QueryCollegeAdminsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.CollegeAdminWhereInput = query.collegeId
      ? { collegeId: query.collegeId }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.collegeAdmin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SAFE_SELECT,
      }),
      this.prisma.collegeAdmin.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const admin = await this.prisma.collegeAdmin.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!admin) throw new NotFoundException('College admin not found');
    return admin;
  }

  async update(id: string, dto: UpdateCollegeAdminDto) {
    await this.findOne(id);
    await this.prisma.collegeAdmin.update({ where: { id }, data: dto });
    return this.findOne(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    const admin = await this.prisma.collegeAdmin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('College admin not found');
    await this.prisma.user.update({ where: { id: admin.userId }, data: { isActive } });
    return this.findOne(id);
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const admin = await this.prisma.collegeAdmin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('College admin not found');
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: admin.userId }, data: { passwordHash } });
    return { success: true };
  }
}
