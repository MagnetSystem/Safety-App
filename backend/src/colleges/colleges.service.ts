import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { OnboardOrganizationDto } from './dto/onboard-organization.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto';
import { QueryCollegesDto } from './dto/query-colleges.dto';
import { Paginated } from '../common/dto/pagination.dto';
import { generateJoinCode, slugCodeFromName } from '../common/codes';
import { parseSettings } from '../common/industry';
import { CacheService } from '../redis/cache.service';
import { OrganizationTypesService } from '../organization-types/organization-types.service';

@Injectable()
export class CollegesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly orgTypes: OrganizationTypesService,
  ) {}

  async create(dto: CreateCollegeDto) {
    const code = dto.code?.trim() || slugCodeFromName(dto.name);
    const existing = await this.prisma.bypassRls(() =>
      this.prisma.organization.findUnique({ where: { code } }),
    );
    if (existing) throw new ConflictException('An organization with this code already exists');

    const industry = ((dto as { industry?: string }).industry ?? 'EDUCATION').toUpperCase();
    const catalog = await this.orgTypes.resolve(industry);
    const typeRow = await this.orgTypes.findTypeRow(industry);
    const settings = await this.orgTypes.settingsForSlug(industry);
    const organization = await this.prisma.bypassRls(() =>
      this.prisma.organization.create({
        data: {
          name: dto.name,
          code,
          joinCode: generateJoinCode(8),
          industry: catalog.id,
          organizationTypeId: typeRow?.id,
          address: dto.address,
          state: dto.state,
          district: dto.district,
          contactName: dto.principal,
          phone: dto.phone,
          email: dto.email,
          settings: settings as unknown as Prisma.InputJsonValue,
        },
      }),
    );
    const templates = catalog.defaultDepartments;
    if (templates.length > 0) {
      await this.prisma.department.createMany({
        data: templates.map((t, i) => ({
          organizationId: organization.id,
          name: t.name,
          slug: t.slug,
          description: t.description,
          isDefault: i === 0,
        })),
      });
    }
    return organization;
  }

  async onboardClient(dto: OnboardOrganizationDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.ownerEmail } });
    if (existingUser) throw new ConflictException('An account with this email already exists');

    const organization = await this.create({
      name: dto.name,
      code: dto.code || dto.name.slice(0, 8),
      address: dto.address,
      state: dto.state,
      district: dto.district,
      principal: dto.principal,
      phone: dto.phone,
      email: dto.email,
      industry: dto.industry,
    });

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);
    await this.prisma.user.create({
      data: {
        email: dto.ownerEmail,
        passwordHash,
        role: UserRole.OWNER,
        orgStaff: {
          create: {
            name: dto.ownerName,
            phone: dto.ownerPhone,
            organizationId: organization.id,
            orgRole: 'OWNER',
          },
        },
      },
    });

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        joinCode: organization.joinCode,
        industry: organization.industry,
      },
      owner: { email: dto.ownerEmail, name: dto.ownerName },
    };
  }

  async findAll(query: QueryCollegesDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.OrganizationWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
            { state: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.prisma.bypassRls(async () => {
      const [items, total] = await Promise.all([
        this.prisma.organization.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            _count: { select: { members: true, staff: true, incidents: true } },
            organizationType: { select: { id: true, slug: true, label: true } },
          },
        }),
        this.prisma.organization.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async findPublicActive() {
    return this.prisma.bypassRls(() =>
      this.prisma.organization.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true, state: true, district: true, industry: true },
      }),
    );
  }

  async findOne(id: string) {
    return this.cache.wrap(this.cache.orgKey(id, 'detail'), 30, async () => {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          _count: { select: { members: true, staff: true, incidents: true, departments: true } },
          departments: { orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, description: true, isDefault: true } },
          organizationType: {
            select: { id: true, slug: true, label: true, blurb: true, memberFields: true, orgSetupFields: true, features: true },
          },
          staff: {
            where: { orgRole: 'OWNER' },
            take: 1,
            select: {
              id: true,
              name: true,
              phone: true,
              user: { select: { id: true, email: true, isActive: true } },
            },
          },
        },
      });
      if (!organization) throw new NotFoundException('Organization not found');
      return organization;
    });
  }

  async update(id: string, dto: UpdateCollegeDto) {
    await this.findOne(id);
    const data: Prisma.OrganizationUpdateInput = {
      name: dto.name,
      address: dto.address,
      state: dto.state,
      district: dto.district,
      contactName: dto.principal,
      phone: dto.phone,
      email: dto.email,
    };
    const updated = await this.prisma.organization.update({ where: { id }, data });
    await this.cache.invalidateOrg(id);
    return updated;
  }

  async updateSettings(id: string, raw: unknown) {
    await this.findOne(id);
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { settings: parseSettings(raw) as unknown as Prisma.InputJsonValue },
    });
    await this.cache.invalidateOrg(id);
    return updated;
  }

  async rotateJoinCode(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { joinCode: generateJoinCode(8) },
      select: { id: true, joinCode: true },
    });
    await this.cache.invalidateOrg(id);
    return updated;
  }

  async updateStatus(id: string, dto: UpdateCollegeStatusDto) {
    await this.findOne(id);
    return this.prisma.bypassRls(() =>
      this.prisma.organization.update({ where: { id }, data: { status: dto.status } }),
    );
  }

  async resetOwnerPassword(organizationId: string, newPassword: string) {
    const owner = await this.prisma.orgStaff.findFirst({
      where: { organizationId, orgRole: 'OWNER' },
    });
    if (!owner) throw new NotFoundException('Owner account not found');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: owner.userId }, data: { passwordHash } });
    return { success: true, ownerEmail: (await this.prisma.user.findUnique({ where: { id: owner.userId }, select: { email: true } }))?.email };
  }
}
