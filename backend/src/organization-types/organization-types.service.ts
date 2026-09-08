import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import {
  INDUSTRY_CATALOG,
  catalogFor,
  settingsFor,
  type CategoryDef,
  type DepartmentTemplate,
  type IndustryCatalog,
  type OrgSettings,
  type ProfileFieldDef,
} from '../common/industry';

export interface UpsertTypeDto {
  slug?: string;
  label: string;
  blurb?: string;
  isActive?: boolean;
  features?: OrgSettings['features'];
  categories?: CategoryDef[];
  defaultDepartments?: DepartmentTemplate[];
  orgSetupFields?: ProfileFieldDef[];
  memberFields?: ProfileFieldDef[];
}

function slugify(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32) || 'CUSTOM';
}

function toCatalog(row: {
  slug: string;
  label: string;
  blurb: string;
  features: Prisma.JsonValue;
  categories: Prisma.JsonValue;
  defaultDepartments: Prisma.JsonValue;
  orgSetupFields: Prisma.JsonValue;
  memberFields: Prisma.JsonValue;
}): IndustryCatalog {
  const fallback = catalogFor(row.slug);
  return {
    id: row.slug,
    label: row.label,
    blurb: row.blurb || fallback.blurb,
    features: (row.features as unknown as IndustryCatalog['features']) ?? fallback.features,
    categories: (row.categories as unknown as CategoryDef[]) ?? fallback.categories,
    defaultDepartments: (row.defaultDepartments as unknown as DepartmentTemplate[]) ?? fallback.defaultDepartments,
    orgSetupFields: (row.orgSetupFields as unknown as ProfileFieldDef[]) ?? fallback.orgSetupFields,
    memberFields: (row.memberFields as unknown as ProfileFieldDef[]) ?? fallback.memberFields,
  };
}

@Injectable()
export class OrganizationTypesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async onModuleInit() {
    await this.ensureBuiltIns();
  }

  async ensureBuiltIns() {
    const count = await this.prisma.bypassRls(() => this.prisma.organizationType.count());
    if (count > 0) return;
    await this.prisma.bypassRls(async () => {
      for (const catalog of Object.values(INDUSTRY_CATALOG)) {
        await this.prisma.organizationType.create({
          data: {
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
    });
  }

  async publicCatalog(): Promise<IndustryCatalog[]> {
    return this.cache.wrap('catalog:industries', 30, async () => {
      const rows = await this.prisma.bypassRls(() =>
        this.prisma.organizationType.findMany({
          where: { isActive: true },
          orderBy: [{ isSystem: 'desc' }, { label: 'asc' }],
        }),
      );
      if (rows.length === 0) return Object.values(INDUSTRY_CATALOG);
      return rows.map(toCatalog);
    });
  }

  async resolve(slug?: string | null): Promise<IndustryCatalog> {
    if (!slug) return catalogFor('CUSTOM');
    const key = slug.toUpperCase().replace(/-/g, '_');
    const row = await this.prisma.bypassRls(() =>
      this.prisma.organizationType.findFirst({
        where: { OR: [{ slug: key }, { slug }], isActive: true },
      }),
    );
    if (row) return toCatalog(row);
    return catalogFor(key);
  }

  async settingsForSlug(slug?: string | null): Promise<OrgSettings> {
    const catalog = await this.resolve(slug);
    return {
      categories: catalog.categories.map((c) => c.key),
      features: { ...catalog.features },
      profileFields: catalog.memberFields.map((f) => f.key),
      profileFieldDefs: catalog.memberFields,
      defaultDepartments: catalog.defaultDepartments,
    };
  }

  async findTypeRow(slug?: string | null) {
    if (!slug) return null;
    const key = slug.toUpperCase().replace(/-/g, '_');
    return this.prisma.bypassRls(() =>
      this.prisma.organizationType.findFirst({ where: { OR: [{ slug: key }, { slug }] } }),
    );
  }

  async listAll() {
    await this.ensureBuiltIns();
    const rows = await this.prisma.bypassRls(() =>
      this.prisma.organizationType.findMany({
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
        include: { _count: { select: { organizations: true } } },
      }),
    );
    return rows.map((row) => ({
      ...toCatalog(row),
      dbId: row.id,
      isSystem: row.isSystem,
      isActive: row.isActive,
      createdAt: row.createdAt,
      orgCount: row._count.organizations,
    }));
  }

  async create(dto: UpsertTypeDto, createdById?: string) {
    const slug = slugify(dto.slug || dto.label);
    const existing = await this.prisma.organizationType.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('A type with this name already exists');
    if (!dto.memberFields?.length) {
      throw new BadRequestException('Add at least one member field (name is required)');
    }
    const created = await this.prisma.organizationType.create({
      data: {
        slug,
        label: dto.label.trim(),
        blurb: dto.blurb?.trim() ?? '',
        isSystem: false,
        isActive: dto.isActive ?? true,
        features: (dto.features ?? settingsFor('CUSTOM').features) as object,
        categories: (dto.categories ?? [{ key: 'OTHER', label: 'Other' }]) as object,
        defaultDepartments: (dto.defaultDepartments ?? []) as object,
        orgSetupFields: (dto.orgSetupFields ?? []) as object,
        memberFields: dto.memberFields as object,
        createdById: createdById ?? null,
      },
    });
    await this.invalidateCatalog();
    return toCatalog(created);
  }

  async update(id: string, dto: UpsertTypeDto) {
    const row = await this.prisma.organizationType.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Organization type not found');
    const updated = await this.prisma.organizationType.update({
      where: { id },
      data: {
        label: dto.label?.trim() ?? row.label,
        blurb: dto.blurb ?? row.blurb,
        isActive: dto.isActive ?? row.isActive,
        features: (dto.features as object) ?? undefined,
        categories: (dto.categories as object) ?? undefined,
        defaultDepartments: (dto.defaultDepartments as object) ?? undefined,
        orgSetupFields: (dto.orgSetupFields as object) ?? undefined,
        memberFields: (dto.memberFields as object) ?? undefined,
      },
    });
    await this.invalidateCatalog();
    return toCatalog(updated);
  }

  async setActive(id: string, isActive: boolean) {
    const row = await this.prisma.organizationType.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Organization type not found');
    if (row.isSystem && !isActive) {
      throw new BadRequestException('Built-in types stay available; hide them by editing instead of deleting');
    }
    await this.prisma.organizationType.update({ where: { id }, data: { isActive } });
    await this.invalidateCatalog();
    return { success: true, isActive };
  }

  async duplicate(id: string, label: string, createdById?: string) {
    const row = await this.prisma.organizationType.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Organization type not found');
    return this.create(
      {
        label,
        blurb: row.blurb,
        features: row.features as unknown as OrgSettings['features'],
        categories: row.categories as unknown as CategoryDef[],
        defaultDepartments: row.defaultDepartments as unknown as DepartmentTemplate[],
        orgSetupFields: row.orgSetupFields as unknown as ProfileFieldDef[],
        memberFields: row.memberFields as unknown as ProfileFieldDef[],
      },
      createdById,
    );
  }

  private async invalidateCatalog() {
    await this.cache.del('catalog:industries');
  }
}
