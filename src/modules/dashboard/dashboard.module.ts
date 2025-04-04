// src/modules/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { FormationsModule } from '../formations/formations.module';

@Module({
  imports: [FormationsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}