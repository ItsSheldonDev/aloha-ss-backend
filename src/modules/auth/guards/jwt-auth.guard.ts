import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Vous pouvez personnaliser la gestion des erreurs ici
    if (err || !user) {
      throw err || new UnauthorizedException('Non autorisé');
    }
    return user;
  }
}