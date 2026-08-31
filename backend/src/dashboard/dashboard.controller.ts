import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student')
  @Roles(UserRole.STUDENT)
  student(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.forStudent(user);
  }

  @Get('college-admin')
  @Roles(UserRole.COLLEGE_ADMIN)
  collegeAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.forCollegeAdmin(user);
  }

  @Get('super-admin')
  @Roles(UserRole.SUPER_ADMIN)
  superAdmin() {
    return this.dashboardService.forSuperAdmin();
  }
}
