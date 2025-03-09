import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FormationsModule } from './modules/formations/formations.module';
import { EmailsModule } from './modules/emails/emails.module';
import { NewsModule } from './modules/news/news.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from './logger/winston.config';
import { InscriptionsModule } from './modules/inscriptions/inscriptions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DatabaseModule } from './modules/database/database.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PrismaModule,
    FormationsModule,
    EmailsModule,
    NewsModule,
    AuthModule,
    InscriptionsModule,
    DocumentsModule,
    GalleryModule,
    UsersModule,
    SettingsModule,
    DatabaseModule,
    DashboardModule,
    HealthModule
  ],
})
export class AppModule {}