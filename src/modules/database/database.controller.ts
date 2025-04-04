import { Controller, Get, Post, Body, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DatabaseService } from './database.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminAuthGuard } from '../auth/guards/superadmin-auth.guard';
import { Express, Response } from 'express';

@ApiTags('database')
@Controller('admin/database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @UseGuards(SuperAdminAuthGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques de la base de données (super admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  getDatabaseStats() {
    return this.databaseService.getDatabaseStats();
  }

  @UseGuards(SuperAdminAuthGuard)
  @Post('export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exporter la base de données (super admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Base de données exportée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async exportDatabase(@Res() res: Response) {
    const backup = await this.databaseService.exportDatabase();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().slice(0, 10)}.json`);
    
    return res.send(JSON.stringify(backup, null, 2));
  }

  @UseGuards(SuperAdminAuthGuard)
  @Post('import')
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
  @ApiOperation({ summary: 'Importer la base de données (super admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Base de données importée avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async importDatabase(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'Aucun fichier fourni' };
    }

    try {
      const data = JSON.parse(file.buffer.toString());
      await this.databaseService.importDatabase(data);
      return { success: true };
    } catch (error) {
      return { error: `Erreur lors de l'import : ${error.message}` };
    }
  }

  @UseGuards(SuperAdminAuthGuard)
  @Post('reset')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Réinitialiser la base de données (super admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Base de données réinitialisée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async resetDatabase() {
    await this.databaseService.resetDatabase();
    return { success: true };
  }
}