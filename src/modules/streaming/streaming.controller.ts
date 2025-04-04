import { Controller, Get, Param, Res, Logger, NotFoundException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import * as mime from 'mime-types';

@ApiTags('streaming')
@Controller('streaming')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);
  private readonly allowedFolders = ['galerie', 'avatars'];
  
  // Chemin absolu vers le répertoire des uploads
  private readonly baseUploadPath = '/var/aloha-ss/Backend/public/uploads';

  @Get(':folder/:filename')
  @ApiOperation({ summary: 'Récupérer un fichier depuis les dossiers uploads' })
  @ApiParam({ name: 'folder', description: 'Nom du dossier (galerie ou avatars)' })
  @ApiParam({ name: 'filename', description: 'Nom du fichier à récupérer' })
  @ApiQuery({ name: 'download', required: false, type: Boolean, description: 'Télécharger le fichier au lieu de le streamer' })
  @ApiResponse({ status: 200, description: 'Fichier récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  async getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Query('download') download: boolean,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Vérifier que le dossier est autorisé (sécurité)
      if (!this.allowedFolders.includes(folder)) {
        this.logger.warn(`Tentative d'accès à un dossier non autorisé: ${folder}`);
        throw new NotFoundException(`Dossier non autorisé`);
      }

      // Éviter la traversée de répertoire (sécurité)
      const sanitizedFilename = filename.replace(/\.\.\//g, '').replace(/\\/g, '');
      
      // Construire le chemin du fichier en utilisant le chemin absolu
      const filePath = `${this.baseUploadPath}/${folder}/${sanitizedFilename}`;
      
      this.logger.log(`Recherche du fichier: ${filePath}`);
      
      // Vérifier si le fichier existe
      if (!existsSync(filePath)) {
        this.logger.warn(`Fichier non trouvé: ${filePath}`);
        throw new NotFoundException(`Fichier non trouvé: ${sanitizedFilename}`);
      }

      // Déterminer le type MIME
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      this.logger.log(`Streaming du fichier: ${filePath}, type MIME: ${mimeType}`);
      
      // Configurer les headers pour le téléchargement si nécessaire
      if (download) {
        res.set({
          'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        });
      }
      
      // Envoyer directement le fichier sans traitement supplémentaire
      res.sendFile(filePath);
    } catch (error) {
      this.logger.error(`Erreur lors du streaming du fichier: ${error.message}`, error.stack);
      throw error;
    }
  }
}