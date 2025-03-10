import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les paramètres publics du système' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès' })
  getPublicSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les paramètres du système (admin)' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour les paramètres du système (super admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Paramètres mis à jour avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }
}