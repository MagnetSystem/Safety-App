import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto';
import { QueryCollegesDto } from './dto/query-colleges.dto';
import { Paginated } from '../common/dto/pagination.dto';

@Injectable()
export class CollegesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCollegeDto) {
    const existing = await this.prisma.college.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('A college with this code already exists');
    return this.prisma.college.create({ data: dto });
  }

  async findAll(query: QueryCollegesDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.CollegeWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
            { state: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.college.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { students: true, admins: true, complaints: true } },
        },
      }),
      this.prisma.college.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findPublicActive() {
    return this.prisma.college.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, state: true, district: true },
    });
  }

  async findOne(id: string) {
    const college = await this.prisma.college.findUnique({
      where: { id },
      include: { _count: { select: { students: true, admins: true, complaints: true } } },
    });
    if (!college) throw new NotFoundException('College not found');
    return college;
  }

  async update(id: string, dto: UpdateCollegeDto) {
    await this.findOne(id);
    return this.prisma.college.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, dto: UpdateCollegeStatusDto) {
    await this.findOne(id);
    return this.prisma.college.update({ where: { id }, data: { status: dto.status } });
  }
}
