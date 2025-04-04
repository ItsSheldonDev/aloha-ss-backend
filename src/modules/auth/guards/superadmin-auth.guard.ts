import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '@prisma/client';

@Injectable()
export class SuperAdminAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // D'abord, vérifier l'authentification JWT
    const isAuthenticated = await super.canActivate(context);
    
    if (!isAuthenticated) {
      return false;
    }
    
    // Ensuite, vérifier si l'utilisateur est un superadmin
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès réservé aux super administrateurs');
    }
    
    return true;
  }
}