// src/users.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, creatorRole: Role): Promise<any> {
    try {
      const existingUser = await this.prisma.admin.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }

      if (createUserDto.role === Role.SUPER_ADMIN && creatorRole !== Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Seuls les super administrateurs peuvent créer d\'autres super administrateurs');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.admin.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la création d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(userRole: Role): Promise<any[]> {
    try {
      const whereClause = userRole !== Role.SUPER_ADMIN ? { role: Role.ADMIN } : {};
      
      const users = await this.prisma.admin.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des administrateurs : ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, userRole: Role): Promise<any> {
    try {
      const user = await this.prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      if (userRole !== Role.SUPER_ADMIN && user.role === Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Vous n\'avez pas les droits pour accéder à cet administrateur');
      }

      return user;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, userRole: Role): Promise<any> {
    try {
      const existingUser = await this.prisma.admin.findUnique({ where: { id } });

      if (!existingUser) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      if (userRole !== Role.SUPER_ADMIN && existingUser.role === Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Vous n\'avez pas les droits pour modifier un super administrateur');
      }

      if (updateUserDto.role === Role.SUPER_ADMIN && userRole !== Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Seuls les super administrateurs peuvent attribuer le rôle de super administrateur');
      }

      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.prisma.admin.findUnique({ where: { email: updateUserDto.email } });
        if (emailExists) {
          throw new ConflictException('Cet email est déjà utilisé');
        }
      }

      const updateData: any = { ...updateUserDto };

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.admin.update({
        where: { id },
        data: updateData,
      });

      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, userRole: Role): Promise<void> {
    try {
      const user = await this.prisma.admin.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      if (userRole !== Role.SUPER_ADMIN && user.role === Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Vous n\'avez pas les droits pour supprimer un super administrateur');
      }

      if (user.role === Role.SUPER_ADMIN) {
        const superAdminCount = await this.prisma.admin.count({ where: { role: Role.SUPER_ADMIN } });
        if (superAdminCount <= 1) {
          throw new BadRequestException('Impossible de supprimer le dernier super administrateur');
        }
      }

      await this.prisma.admin.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const user = await this.prisma.admin.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

      await this.prisma.admin.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (error) {
      this.logger.error(`Erreur lors du changement de mot de passe : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMe(userId: string): Promise<any> {
    try {
      const user = await this.prisma.admin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Profil non trouvé');
      }

      return user;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du profil : ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateAvatar(id: string, file: Express.Multer.File): Promise<any> {
    try {
      const user = await this.prisma.admin.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      if (!file) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      const tempPath = file.path;
      if (!fs.existsSync(tempPath)) {
        throw new BadRequestException('Fichier temporaire introuvable');
      }

      const avatarPath = `/uploads/avatars/${file.filename}`;
      const finalPath = path.join(process.cwd(), 'public', avatarPath);

      const directory = path.dirname(finalPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      await fs.promises.rename(tempPath, finalPath);
      this.logger.log(`Fichier déplacé vers : ${finalPath}`);

      const updatedUser = await this.prisma.admin.update({
        where: { id },
        data: { avatar: avatarPath },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour de l'avatar : ${error.message}`, error.stack);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        this.logger.log(`Fichier temporaire supprimé : ${file.path}`);
      }
      throw error;
    }
  }
}