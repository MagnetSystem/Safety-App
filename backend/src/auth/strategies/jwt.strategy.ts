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

  /**
   * Re-checks isActive/college status on every request (not just at login) so a
   * Super Admin suspending a college or resetting an account takes effect immediately.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account no longer active');
    }

    if (payload.collegeId) {
      const college = await this.prisma.college.findUnique({
        where: { id: payload.collegeId },
      });
      if (!college || college.status !== 'ACTIVE') {
        throw new UnauthorizedException('College account has been suspended');
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      collegeId: payload.collegeId,
    };
  }
}
