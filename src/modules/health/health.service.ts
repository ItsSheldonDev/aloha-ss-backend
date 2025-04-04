// src/modules/health/health.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const startTime = process.hrtime();
    
    // Vérifier la connexion à la base de données
    let dbStatus = 'ok';
    try {
      // Exécuter une requête simple pour vérifier la connexion
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'error';
    }
    
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6; // en millisecondes
    
    return {
      status: dbStatus === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
      },
      responseTime: `${responseTime.toFixed(2)}ms`,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}