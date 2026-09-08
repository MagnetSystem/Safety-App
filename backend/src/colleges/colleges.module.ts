import { Module } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';
import { OrganizationTypesModule } from '../organization-types/organization-types.module';

@Module({
  imports: [OrganizationTypesModule],
  controllers: [CollegesController],
  providers: [CollegesService],
  exports: [CollegesService],
})
export class CollegesModule {}
