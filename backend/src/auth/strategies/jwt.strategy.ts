import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser, JwtPayload } from '../types/jwt-payload.interface';

const SESSION_TTL_MS = 30_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly sessionCache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

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
    const organizationId = payload.organizationId ?? payload.collegeId ?? null;
    const cacheKey = `${payload.sub}:${organizationId ?? ''}`;
    const cached = this.sessionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.user;

    const row = await this.prisma.bypassRls(() =>
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          orgStaff: { select: { organization: { select: { id: true, status: true } } } },
          member: { select: { organization: { select: { id: true, status: true } } } },
        },
      }),
    );
    if (!row || !row.isActive) {
      this.sessionCache.delete(cacheKey);
      throw new UnauthorizedException('Account no longer active');
    }

    if (organizationId) {
      const org =
        row.orgStaff?.organization?.id === organizationId
          ? row.orgStaff.organization
          : row.member?.organization?.id === organizationId
            ? row.member.organization
            : await this.prisma.bypassRls(() =>
                this.prisma.organization.findUnique({
                  where: { id: organizationId },
                  select: { status: true },
                }),
              );
      if (!org || org.status !== 'ACTIVE') {
        this.sessionCache.delete(cacheKey);
        throw new UnauthorizedException('Organization account has been suspended');
      }
    }

    const user: AuthenticatedUser = {
      id: row.id,
      email: row.email,
      role: row.role,
      organizationId,
      collegeId: organizationId,
    };
    this.sessionCache.set(cacheKey, { user, expiresAt: Date.now() + SESSION_TTL_MS });
    if (this.sessionCache.size > 2_000) {
      const now = Date.now();
      for (const [key, value] of this.sessionCache) {
        if (value.expiresAt <= now) this.sessionCache.delete(key);
      }
    }
    return user;
  }
}
