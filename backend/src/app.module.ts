import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RedisThrottlerStorage } from './redis/redis-throttler.storage';
import { DepartmentsModule } from './departments/departments.module';
import { OrganizationTypesModule } from './organization-types/organization-types.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

import { AuthModule } from './auth/auth.module';
import { CollegesModule } from './colleges/colleges.module';
import { CollegeAdminsModule } from './college-admins/college-admins.module';
import { StudentsModule } from './students/students.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { EvidenceModule } from './evidence/evidence.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { GuardiansModule } from './guardians/guardians.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [RedisThrottlerStorage, ConfigService],
      useFactory: (storage: RedisThrottlerStorage, config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('NODE_ENV') === 'production' ? 60_000 : 60_000,
            limit: config.get('NODE_ENV') === 'production' ? 80 : 180,
          },
        ],
        storage,
      }),
    }),
    PrismaModule,
    AuthModule,
    CollegesModule,
    CollegeAdminsModule,
    StudentsModule,
    ComplaintsModule,
    EvidenceModule,
    NotificationsModule,
    AuditLogsModule,
    DashboardModule,
    SearchModule,
    GuardiansModule,
    DepartmentsModule,
    OrganizationTypesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
