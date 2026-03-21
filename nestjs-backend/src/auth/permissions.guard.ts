import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from './decorators/require-permissions.decorator';
import { permissionsForRole, type Permission } from './permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request?.user as { role?: unknown } | undefined;

    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    const role = typeof user.role === 'string' ? user.role : undefined;
    const permissions = permissionsForRole(role);

    const ok = requiredPermissions.every((p) => permissions.includes(p));
    if (!ok) {
      throw new ForbiddenException('无权限');
    }

    return true;
  }
}
