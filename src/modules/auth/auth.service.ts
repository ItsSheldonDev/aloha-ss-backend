import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(`Tentative de connexion avec un email inconnu: ${email}`);
        return null;
      }

      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Mot de passe incorrect pour l'utilisateur: ${email}`);
        return null;
      }

      // Ne pas retourner le mot de passe
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la validation de l'utilisateur: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    this.logger.log(`Utilisateur connecté avec succès: ${user.email}`);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.warn(`Token JWT invalide: ${error.message}`);
      return null;
    }
  }
}