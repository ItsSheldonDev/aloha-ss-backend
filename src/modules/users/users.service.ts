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
      // Vérifier si l'email existe déjà
      const existingUser = await this.prisma.admin.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }

      // Vérifier que seuls les super admins peuvent créer des super admins
      if (createUserDto.role === Role.SUPER_ADMIN && creatorRole !== Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Seuls les super administrateurs peuvent créer d\'autres super administrateurs');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Créer l'administrateur
      const user = await this.prisma.admin.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      // Retourner l'utilisateur sans le mot de passe
      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la création d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(userRole: Role): Promise<any[]> {
    try {
      // Si l'utilisateur n'est pas un super administrateur, il ne peut voir que les administrateurs
      const whereClause = userRole !== Role.SUPER_ADMIN 
        ? { role: Role.ADMIN } 
        : {};
      
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

      // Vérifier que les admins normaux ne peuvent pas voir les super admins
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
      // Vérifier si l'utilisateur existe
      const existingUser = await this.prisma.admin.findUnique({ 
        where: { id } 
      });

      if (!existingUser) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      // Vérifications de sécurité
      // 1. Un admin ne peut pas modifier un super admin
      if (userRole !== Role.SUPER_ADMIN && existingUser.role === Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Vous n\'avez pas les droits pour modifier un super administrateur');
      }

      // 2. Seul un super admin peut changer un rôle en super admin
      if (updateUserDto.role === Role.SUPER_ADMIN && userRole !== Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Seuls les super administrateurs peuvent attribuer le rôle de super administrateur');
      }

      // 3. Vérifier si le nouvel email n'est pas déjà utilisé par un autre utilisateur
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.prisma.admin.findUnique({
          where: { email: updateUserDto.email }
        });

        if (emailExists) {
          throw new ConflictException('Cet email est déjà utilisé');
        }
      }

      // Préparer les données à mettre à jour
      const updateData: any = { ...updateUserDto };

      // Si le mot de passe est fourni, le hasher
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await this.prisma.admin.update({
        where: { id },
        data: updateData,
      });

      // Retourner l'utilisateur sans le mot de passe
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, userRole: Role): Promise<void> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.prisma.admin.findUnique({ 
        where: { id } 
      });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      // Empêcher la suppression d'un super admin par un admin normal
      if (userRole !== Role.SUPER_ADMIN && user.role === Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Vous n\'avez pas les droits pour supprimer un super administrateur');
      }

      // Empêcher la suppression du dernier super administrateur
      if (user.role === Role.SUPER_ADMIN) {
        const superAdminCount = await this.prisma.admin.count({
          where: { role: Role.SUPER_ADMIN }
        });

        if (superAdminCount <= 1) {
          throw new BadRequestException('Impossible de supprimer le dernier super administrateur');
        }
      }

      // Supprimer l'utilisateur
      await this.prisma.admin.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression d'un administrateur : ${error.message}`, error.stack);
      throw error;
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.prisma.admin.findUnique({ 
        where: { id } 
      });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      // Vérifier l'ancien mot de passe
      const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

      // Mettre à jour le mot de passe
      await this.prisma.admin.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (error) {
      this.logger.error(`Erreur lors du changement de mot de passe : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getProfile(id: string): Promise<any> {
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
      // Vérifier si l'utilisateur existe
      const user = await this.prisma.admin.findUnique({ 
        where: { id } 
      });

      if (!user) {
        throw new NotFoundException(`Administrateur avec l'ID ${id} non trouvé`);
      }

      // Vérifier si le fichier est valide
      if (!file) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      // Utiliser file.path avec diskStorage (chemin temporaire)
      const tempPath = file.path;
      if (!fs.existsSync(tempPath)) {
        throw new BadRequestException('Fichier temporaire introuvable');
      }

      // Définir le chemin final
      const avatarPath = `/uploads/avatars/${file.filename}`; // file.filename est généré par diskStorage
      const finalPath = path.join(process.cwd(), 'public', avatarPath);

      // Assurer que le répertoire existe
      const directory = path.dirname(finalPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Déplacer le fichier temporaire vers la destination finale
      await fs.promises.rename(tempPath, finalPath);
      this.logger.log(`Fichier déplacé vers : ${finalPath}`);

      // Mettre à jour l'avatar de l'utilisateur
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
      // Nettoyer le fichier temporaire en cas d'erreur
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        this.logger.log(`Fichier temporaire supprimé : ${file.path}`);
      }
      throw error;
    }
  }
}