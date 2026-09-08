import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('member')
  @Roles(UserRole.MEMBER)
  member(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.forMember(user);
  }

  /** @deprecated Use /dashboard/member */
  @Get('student')
  @Roles(UserRole.MEMBER)
  student(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.forMember(user);
  }

  @Get('staff')
  @Roles(UserRole.STAFF)
  staff(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.forStaff(user);
  }

  /** @deprecated Use /dashboard/staff */
  @Get('college-admin')
  @Roles(UserRole.STAFF)
  collegeAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.forStaff(user);
  }

  @Get('support')
  @Roles(UserRole.SUPPORT)
  support() {
    return this.dashboardService.forSupport();
  }

  /** @deprecated Use /dashboard/support */
  @Get('super-admin')
  @Roles(UserRole.SUPPORT)
  superAdmin() {
    return this.dashboardService.forSupport();
  }
}
