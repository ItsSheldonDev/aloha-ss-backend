// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Vérifier l\'état de santé de l\'API' })
  @ApiResponse({ status: 200, description: 'L\'API fonctionne correctement' })
  check() {
    return this.healthService.check();
  }
}