import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { OrganizationTypesService } from './organization-types.service';

class FieldDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsString()
  type!: string;

  @IsString()
  group!: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  help?: string;
}

class CategoryDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;
}

class DepartmentDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class FeaturesDto {
  @IsOptional()
  @IsBoolean()
  guardianAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  bulkSignup?: boolean;

  @IsOptional()
  @IsBoolean()
  reporting?: boolean;

  @IsOptional()
  @IsBoolean()
  departmentsEnabled?: boolean;
}

class UpsertTypeBody {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(2)
  label!: string;

  @IsOptional()
  @IsString()
  blurb?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeaturesDto)
  features?: FeaturesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories?: CategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentDto)
  defaultDepartments?: DepartmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDto)
  orgSetupFields?: FieldDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDto)
  memberFields!: FieldDto[];
}

class DuplicateBody {
  @IsString()
  @MinLength(2)
  label!: string;
}

@Controller()
export class OrganizationTypesController {
  constructor(private readonly types: OrganizationTypesService) {}

  @Get('catalog/industries')
  @Public()
  publicCatalog() {
    return this.types.publicCatalog();
  }

  @Get('organization-types')
  @Roles(UserRole.SUPPORT)
  list() {
    return this.types.listAll();
  }

  @Post('organization-types')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORG_TYPE_CREATED', entityType: 'OrganizationType' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertTypeBody) {
    return this.types.create(dto as any, user.id);
  }

  @Patch('organization-types/:id')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORG_TYPE_UPDATED', entityType: 'OrganizationType' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertTypeBody) {
    return this.types.update(id, dto as any);
  }

  @Patch('organization-types/:id/active')
  @Roles(UserRole.SUPPORT)
  setActive(@Param('id', ParseUUIDPipe) id: string, @Body() body: { isActive: boolean }) {
    return this.types.setActive(id, body.isActive);
  }

  @Post('organization-types/:id/duplicate')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORG_TYPE_DUPLICATED', entityType: 'OrganizationType' })
  duplicate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DuplicateBody,
  ) {
    return this.types.duplicate(id, body.label, user.id);
  }
}
