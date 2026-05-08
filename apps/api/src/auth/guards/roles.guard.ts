import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FamilyRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<FamilyRole[]>(ROLES_KEY, ctx.getHandler());
    if (!requiredRoles) return true;
    const req = ctx.switchToHttp().getRequest();
    const familyId = req.params.familyId || req.body?.familyId;
    if (!familyId) return false;
    const member = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId: req.user.id } },
    });
    if (!member) return false;
    const rank: Record<FamilyRole, number> = { SUPER_ADMIN: 4, BRANCH_ADMIN: 3, MEMBER: 2, VIEWER: 1 };
    return rank[member.role] >= Math.min(...requiredRoles.map(r => rank[r]));
  }
}
