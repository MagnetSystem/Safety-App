import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateInviteCode, hashToken } from '../common/codes';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(memberUserId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId: memberUserId } });
    if (!member) throw new NotFoundException('Member profile not found');

    const raw = generateInviteCode();
    const link = await this.prisma.guardianLink.create({
      data: {
        memberId: member.id,
        inviteCodeHash: hashToken(raw),
        inviteCodeExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
        status: 'PENDING',
      },
    });

    return {
      id: link.id,
      code: raw,
      expiresAt: link.inviteCodeExpiresAt,
      status: link.status,
    };
  }

  async listMine(memberUserId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId: memberUserId } });
    if (!member) throw new NotFoundException('Member profile not found');

    return this.prisma.guardianLink.findMany({
      where: { memberId: member.id, status: { in: ['PENDING', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        acceptedAt: true,
        guardian: { select: { id: true, email: true } },
      },
    });
  }

  async listWards(guardianUserId: string) {
    return this.prisma.guardianLink.findMany({
      where: { guardianUserId, status: 'ACTIVE' },
      select: {
        id: true,
        acceptedAt: true,
        member: { select: { id: true, name: true } },
      },
    });
  }

  async accept(userId: string, code: string) {
    const hashed = hashToken(code.trim().toUpperCase());
    const link = await this.prisma.guardianLink.findUnique({ where: { inviteCodeHash: hashed } });
    if (!link || link.status !== 'PENDING') {
      throw new BadRequestException('This invite code is invalid');
    }
    if (link.inviteCodeExpiresAt && link.inviteCodeExpiresAt < new Date()) {
      throw new BadRequestException('This invite code has expired');
    }

    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (member && member.id === link.memberId) {
      throw new BadRequestException('You cannot be your own guardian');
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role === UserRole.MEMBER) {
      // A member can also act as someone's guardian without changing their primary role.
    } else if (user.role !== UserRole.GUARDIAN) {
      await this.prisma.user.update({ where: { id: userId }, data: { role: UserRole.GUARDIAN } });
    }

    return this.prisma.guardianLink.update({
      where: { id: link.id },
      data: {
        guardianUserId: userId,
        status: 'ACTIVE',
        acceptedAt: new Date(),
        inviteCodeHash: null,
        inviteCodeExpiresAt: null,
      },
      select: {
        id: true,
        status: true,
        acceptedAt: true,
        member: { select: { id: true, name: true } },
      },
    });
  }

  async revoke(memberUserId: string, linkId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId: memberUserId } });
    if (!member) throw new NotFoundException('Member profile not found');

    const link = await this.prisma.guardianLink.findUnique({ where: { id: linkId } });
    if (!link || link.memberId !== member.id) throw new NotFoundException('Guardian link not found');

    return this.prisma.guardianLink.update({
      where: { id: linkId },
      data: { status: 'REVOKED', inviteCodeHash: null },
    });
  }
}
