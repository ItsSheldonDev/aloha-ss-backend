import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si aucun rôle n'est requis, on autorise l'accès
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new UnauthorizedException('Vous devez être connecté pour accéder à cette ressource');
    }
    
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Vous n\'avez pas les droits nécessaires pour accéder à cette ressource');
    }
    
    return true;
  }
}