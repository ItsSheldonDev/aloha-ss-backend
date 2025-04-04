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
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
  import { NewsService } from './news.service';
  import { CreateNewsDto } from './dto/create-news.dto';
  import { UpdateNewsDto } from './dto/update-news.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('news')
  @Controller('news')
  export class NewsController {
    constructor(private readonly newsService: NewsService) {}
  
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les actualités publiées (accès public)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page pour la pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
    @ApiResponse({ status: 200, description: 'Liste des actualités publiées avec pagination' })
    findAllPublic(
      @Query('page') page?: string,
      @Query('limit') limit?: string,
    ) {
      return this.newsService.findAll(
        true,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 10
      );
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer toutes les actualités (admin)' })
    @ApiResponse({ status: 200, description: 'Liste de toutes les actualités' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    findAll() {
      return this.newsService.findAll(false);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer une actualité par son ID (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'actualité' })
    @ApiResponse({ status: 200, description: 'Détails de l\'actualité' })
    @ApiResponse({ status: 404, description: 'Actualité non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    findOne(@Param('id') id: string) {
      return this.newsService.findOne(id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Créer une nouvelle actualité (admin)' })
    @ApiResponse({ status: 201, description: 'Actualité créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    create(@Body() createNewsDto: CreateNewsDto) {
      return this.newsService.create(createNewsDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Put('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mettre à jour une actualité (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'actualité à mettre à jour' })
    @ApiResponse({ status: 200, description: 'Actualité mise à jour avec succès' })
    @ApiResponse({ status: 404, description: 'Actualité non trouvée' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    update(
      @Param('id') id: string,
      @Body() updateNewsDto: UpdateNewsDto,
    ) {
      return this.newsService.update(id, updateNewsDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Supprimer une actualité (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'actualité à supprimer' })
    @ApiResponse({ status: 200, description: 'Actualité supprimée avec succès' })
    @ApiResponse({ status: 404, description: 'Actualité non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    remove(@Param('id') id: string) {
      return this.newsService.remove(id);
    }
  }