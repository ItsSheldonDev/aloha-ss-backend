// src/modules/formations/formations.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FormationsService, FormattedFormation } from './formations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('formations')
@Controller('formations')
export class FormationsController {
  private readonly logger = new Logger(FormationsController.name);

  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les formations (accès public)' })
  @ApiQuery({ name: 'type', required: false, description: 'Type de formation' })
  @ApiQuery({ name: 'period', required: false, description: 'Période (all, 2024, 2025, recent)' })
  @ApiResponse({ status: 200, description: 'Liste des formations récupérée avec succès' })
  findAll(
    @Query('type') type?: string,
    @Query('period') period?: string,
  ): Promise<FormattedFormation[]> {
    return this.formationsService.findAll(type, period);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Télécharger un nouveau fichier Excel des formations (admin)' })
  @ApiResponse({ status: 200, description: 'Fichier Excel téléchargé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou fichier manquant' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async uploadExcelFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      this.logger.warn('Aucun fichier fourni dans la requête');
      throw new BadRequestException('Aucun fichier fourni');
    }
    
    this.logger.log(`Fichier reçu: ${file.originalname}, taille: ${file.size} octets, type: ${file.mimetype}`);
    return this.formationsService.uploadExcelFile(file);
  }
}