import { Module } from '@nestjs/common';
import { OrganizationTypesService } from './organization-types.service';
import { OrganizationTypesController } from './organization-types.controller';

@Module({
  controllers: [OrganizationTypesController],
  providers: [OrganizationTypesService],
  exports: [OrganizationTypesService],
})
export class OrganizationTypesModule {}
