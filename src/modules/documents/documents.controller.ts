// src/modules/documents/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DocumentCategory, Role } from '@prisma/client';
import { Response } from 'express';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les documents (accès public)' })
  @ApiQuery({ name: 'category', enum: DocumentCategory, required: false, description: 'Filtrer par catégorie' })
  @ApiResponse({ status: 200, description: 'Liste des documents récupérée avec succès' })
  findAll(@Query('category') category?: DocumentCategory) {
    return this.documentsService.findAll(category);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger un document (accès public)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document téléchargé avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mimetype, filename } = await this.documentsService.getFileForDownload(id);
    
    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string', enum: Object.values(DocumentCategory) },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau document (admin)' })
  @ApiResponse({ status: 201, description: 'Document créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou fichier manquant' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.create(createDocumentDto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les documents (admin)' })
  @ApiQuery({ name: 'category', enum: DocumentCategory, required: false, description: 'Filtrer par catégorie' })
  @ApiResponse({ status: 200, description: 'Liste des documents récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  findAllAdmin(@Query('category') category?: DocumentCategory) {
    return this.documentsService.findAll(category);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un document par son ID (admin)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un document (admin)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un document (admin)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
    return { success: true };
  }
}