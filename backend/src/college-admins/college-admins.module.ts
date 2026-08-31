import { Module } from '@nestjs/common';
import { CollegeAdminsService } from './college-admins.service';
import { CollegeAdminsController } from './college-admins.controller';

@Module({
  controllers: [CollegeAdminsController],
  providers: [CollegeAdminsService],
})
export class CollegeAdminsModule {}
