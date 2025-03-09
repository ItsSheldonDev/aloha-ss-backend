import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques pour le tableau de bord' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('yearly-stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques annuelles' })
  @ApiResponse({ status: 200, description: 'Statistiques annuelles récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getYearlyStats() {
    return this.dashboardService.getYearlyStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('inscription-trends')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les tendances d\'inscription' })
  @ApiResponse({ status: 200, description: 'Tendances récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getInscriptionTrends() {
    return this.dashboardService.getInscriptionTrends();
  }
}