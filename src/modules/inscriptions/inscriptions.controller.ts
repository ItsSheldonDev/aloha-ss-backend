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
  import { InscriptionsService } from './inscriptions.service';
  import { CreateInscriptionDto } from './dto/create-inscription.dto';
  import { UpdateInscriptionDto } from './dto/update-inscription.dto';
  import { UpdateInscriptionStatusDto } from './dto/update-inscription-status.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { Role, StatutInscription } from '@prisma/client';
  
  @ApiTags('inscriptions')
  @Controller('inscriptions')
  export class InscriptionsController {
    constructor(private readonly inscriptionsService: InscriptionsService) {}
  
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle inscription (accès public)' })
    @ApiResponse({ status: 201, description: 'Inscription créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides ou plus de places disponibles' })
    @ApiResponse({ status: 404, description: 'Formation non trouvée' })
    create(@Body() createInscriptionDto: CreateInscriptionDto) {
      return this.inscriptionsService.create(createInscriptionDto);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Get('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer toutes les inscriptions (admin)' })
    @ApiQuery({ name: 'formationId', required: false, description: 'Filtrer par ID de formation' })
    @ApiQuery({ name: 'status', enum: StatutInscription, required: false, description: 'Filtrer par statut' })
    @ApiQuery({ name: 'search', required: false, description: 'Rechercher par nom, prénom ou email' })
    @ApiResponse({ status: 200, description: 'Liste des inscriptions récupérée avec succès' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    findAll(
      @Query('formationId') formationId?: string,
      @Query('status') status?: StatutInscription,
      @Query('search') search?: string,
    ) {
      return this.inscriptionsService.findAll(formationId, status, search);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Get('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer une inscription par son ID (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
    @ApiResponse({ status: 200, description: 'Inscription récupérée avec succès' })
    @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    findOne(@Param('id') id: string) {
      return this.inscriptionsService.findOne(id);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Put('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mettre à jour une inscription (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
    @ApiResponse({ status: 200, description: 'Inscription mise à jour avec succès' })
    @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    update(
      @Param('id') id: string,
      @Body() updateInscriptionDto: UpdateInscriptionDto,
    ) {
      return this.inscriptionsService.update(id, updateInscriptionDto);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Put('admin/:id/status')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mettre à jour le statut d\'une inscription (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
    @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
    @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    updateStatus(
      @Param('id') id: string,
      @Body() updateStatusDto: UpdateInscriptionStatusDto,
    ) {
      return this.inscriptionsService.updateStatus(id, updateStatusDto);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Delete('admin/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Supprimer une inscription (admin)' })
    @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
    @ApiResponse({ status: 200, description: 'Inscription supprimée avec succès' })
    @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    remove(@Param('id') id: string) {
      return this.inscriptionsService.remove(id);
    }
  }