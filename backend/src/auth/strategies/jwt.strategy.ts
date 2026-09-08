import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser, JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.bypassRls(() =>
      this.prisma.user.findUnique({ where: { id: payload.sub } }),
    );
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account no longer active');
    }

    const organizationId = payload.organizationId ?? payload.collegeId ?? null;
    if (organizationId) {
      const organization = await this.prisma.bypassRls(() =>
        this.prisma.organization.findUnique({ where: { id: organizationId } }),
      );
      if (!organization || organization.status !== 'ACTIVE') {
        throw new UnauthorizedException('Organization account has been suspended');
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId,
      collegeId: organizationId,
    };
  }
}
