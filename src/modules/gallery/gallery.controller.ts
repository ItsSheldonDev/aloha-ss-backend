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
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
  import { GalleryService } from './gallery.service';
  import { CreateImageDto } from './dto/create-image.dto';
  import { UpdateImageDto } from './dto/update-image.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { Category, Role } from '@prisma/client';
  import { Express } from 'express';
  
  @ApiTags('gallery')
  @Controller('gallery')
  export class GalleryController {
    constructor(private readonly galleryService: GalleryService) {}
  
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les images (accès public)' })
    @ApiQuery({ name: 'category', enum: Category, required: false, description: 'Filtrer par catégorie' })
    @ApiQuery({ name: 'mode', enum: ['all', 'random'], required: false, description: 'Mode de récupération (all = par catégorie, random = images aléatoires)' })
    @ApiResponse({ status: 200, description: 'Liste des images récupérée avec succès' })
    findAll(
      @Query('category') category?: Category,
      @Query('mode') mode?: string,
    ) {
      return this.galleryService.findAll(category, mode);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Post('admin')
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          alt: { type: 'string' },
          category: { type: 'string', enum: Object.values(Category) },
          image: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Télécharger une nouvelle image (admin)' })
    @ApiResponse({ status: 201, description: 'Image créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides ou fichier manquant' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    create(
      @Body() createImageDto: CreateImageDto,
      @UploadedFile() file: Express.Multer.File,
    ) {
      return this.galleryService.create(createImageDto, file);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Get('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer toutes les images (admin)' })
    @ApiQuery({ name: 'category', enum: Category, required: false, description: 'Filtrer par catégorie' })
    @ApiResponse({ status: 200, description: 'Liste des images récupérée avec succès' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    findAllAdmin(@Query('category') category?: Category) {
      return this.galleryService.findAll(category);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Get('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer une image par son ID (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'image' })
    @ApiResponse({ status: 200, description: 'Image récupérée avec succès' })
    @ApiResponse({ status: 404, description: 'Image non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    findOne(@Param('id') id: string) {
      return this.galleryService.findOne(id);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Put('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mettre à jour une image (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'image' })
    @ApiResponse({ status: 200, description: 'Image mise à jour avec succès' })
    @ApiResponse({ status: 404, description: 'Image non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    update(
      @Param('id') id: string,
      @Body() updateImageDto: UpdateImageDto,
    ) {
      return this.galleryService.update(id, updateImageDto);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Delete('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Supprimer une image (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'image' })
    @ApiResponse({ status: 200, description: 'Image supprimée avec succès' })
    @ApiResponse({ status: 404, description: 'Image non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    remove(@Param('id') id: string) {
      this.galleryService.remove(id);
      return { success: true };
    }
  }