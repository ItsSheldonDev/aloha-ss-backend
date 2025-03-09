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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { UpdateFormationStatusDto } from './dto/update-formation-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TypeFormation, StatutFormation, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('formations')
@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les formations disponibles (accès public)' })
  @ApiQuery({ name: 'type', enum: TypeFormation, required: false })
  @ApiQuery({ name: 'month', example: '2023-12', required: false })
  findAllPublic(
    @Query('type') type?: TypeFormation,
    @Query('month') month?: string,
  ) {
    return this.formationsService.findAll(type, month, undefined, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer toutes les formations (admin)' })
  @ApiQuery({ name: 'type', enum: TypeFormation, required: false })
  @ApiQuery({ name: 'month', example: '2023-12', required: false })
  @ApiQuery({ name: 'status', enum: StatutFormation, required: false })
  findAll(
    @Query('type') type?: TypeFormation,
    @Query('month') month?: string,
    @Query('status') status?: StatutFormation,
  ) {
    return this.formationsService.findAll(type, month, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer une formation par son ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.formationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle formation (admin)' })
  create(@Body() createFormationDto: CreateFormationDto) {
    return this.formationsService.create(createFormationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour une formation (admin)' })
  update(
    @Param('id') id: string,
    @Body() updateFormationDto: UpdateFormationDto,
  ) {
    return this.formationsService.update(id, updateFormationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put('admin/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une formation (admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFormationStatusDto,
  ) {
    return this.formationsService.updateStatus(id, updateStatusDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une formation (admin)' })
  remove(@Param('id') id: string) {
    return this.formationsService.remove(id);
  }
}