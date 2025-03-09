// src/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminAuthGuard } from '../auth/guards/superadmin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Express } from 'express';
import { Logger } from '@nestjs/common';

@ApiTags('users')
@Controller('admin/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouvel administrateur (super admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Administrateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    this.logger.log(`Création d'un nouvel administrateur par ${req.user.email}`);
    return this.usersService.create(createUserDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer la liste des administrateurs' })
  @ApiResponse({ status: 200, description: 'Liste des administrateurs récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  findAll(@Request() req) {
    this.logger.log(`Récupération de la liste des administrateurs par ${req.user.email}`);
    return this.usersService.findAll(req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer son propre profil' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getMe(@Request() req) {
    this.logger.log(`Récupération du profil pour l'utilisateur ${req.user.id}`);
    return this.usersService.getMe(req);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer son propre mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Changement de mot de passe pour l'utilisateur ${req.user.id}`);
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour son propre avatar' })
  @ApiResponse({ status: 200, description: 'Avatar mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier manquant ou invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async updateAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    this.logger.log(`Mise à jour de l'avatar pour l'utilisateur ${req.user.id}`);
    if (!file) {
      this.logger.warn('Aucun fichier fourni dans la requête');
      throw new BadRequestException('Aucun fichier fourni');
    }
    this.logger.log('Fichier reçu:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      bufferExists: !!file.buffer,
      bufferLength: file.buffer ? file.buffer.length : 'N/A',
    });
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un administrateur par son ID' })
  @ApiParam({ name: 'id', description: "ID de l'administrateur" })
  @ApiResponse({ status: 200, description: 'Administrateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Administrateur non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  findOne(@Param('id') id: string, @Request() req) {
    this.logger.log(`Récupération de l'administrateur ${id} par ${req.user.email}`);
    return this.usersService.findOne(id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un administrateur (super admin uniquement)' })
  @ApiParam({ name: 'id', description: "ID de l'administrateur" })
  @ApiResponse({ status: 200, description: 'Administrateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Administrateur non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    this.logger.log(`Mise à jour de l'administrateur ${id} par ${req.user.email}`);
    return this.usersService.update(id, updateUserDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un administrateur (super admin uniquement)' })
  @ApiParam({ name: 'id', description: "ID de l'administrateur" })
  @ApiResponse({ status: 200, description: 'Administrateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Administrateur non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`Suppression de l'administrateur ${id} par ${req.user.email}`);
    return this.usersService.remove(id, req.user.role);
  }
}