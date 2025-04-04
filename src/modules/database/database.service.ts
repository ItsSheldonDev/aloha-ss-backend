// src/modules/database/database.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async exportDatabase(): Promise<any> {
    try {
      // Récupérer toutes les données
      const [admins, settings, documents, images, news, emailTemplates] = await Promise.all([
        this.prisma.admin.findMany({
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            role: true,
            avatar: true,
            createdAt: true,
            // Ne pas inclure le mot de passe pour des raisons de sécurité
          },
        }),
        this.prisma.setting.findMany(),
        this.prisma.document.findMany(),
        this.prisma.image.findMany(),
        this.prisma.news.findMany(),
        this.prisma.emailTemplate.findMany(),
      ]);

      // Créer la structure de données pour l'export
      const backup = {
        metadata: {
          version: '1.0',
          exportDate: new Date().toISOString(),
        },
        data: {
          admins,
          settings,
          documents,
          images,
          news,
          emailTemplates,
        },
      };

      // Mettre à jour la date de dernière sauvegarde
      await this.prisma.setting.upsert({
        where: { key: 'lastBackup' },
        create: {
          key: 'lastBackup',
          value: new Date().toISOString(),
        },
        update: {
          value: new Date().toISOString(),
        },
      });

      return backup;
    } catch (error) {
      this.logger.error(`Erreur lors de l'export de la base de données : ${error.message}`, error.stack);
      throw error;
    }
  }

  async importDatabase(data: any): Promise<void> {
    try {
      // Validation basique du format des données
      if (!data || !data.data) {
        throw new BadRequestException('Format de données invalide');
      }

      // Transaction pour assurer l'intégrité des données
      await this.prisma.$transaction(async (tx) => {
        // Réinitialiser certaines tables (mais garder les administrateurs)
        await tx.setting.deleteMany();
        await tx.document.deleteMany();
        await tx.image.deleteMany();
        await tx.news.deleteMany();
        await tx.emailTemplate.deleteMany();

        // Restaurer les données (sauf les admins pour la sécurité)
        if (data.data.settings && data.data.settings.length > 0) {
          await this.importSettings(tx, data.data.settings);
        }

        if (data.data.documents && data.data.documents.length > 0) {
          await this.importDocuments(tx, data.data.documents);
        }

        if (data.data.images && data.data.images.length > 0) {
          await this.importImages(tx, data.data.images);
        }

        if (data.data.news && data.data.news.length > 0) {
          await this.importNews(tx, data.data.news);
        }

        if (data.data.emailTemplates && data.data.emailTemplates.length > 0) {
          await this.importEmailTemplates(tx, data.data.emailTemplates);
        }

        // Mettre à jour la date de dernière restauration
        await tx.setting.upsert({
          where: { key: 'lastRestore' },
          create: {
            key: 'lastRestore',
            value: new Date().toISOString(),
          },
          update: {
            value: new Date().toISOString(),
          },
        });
      });
    } catch (error) {
      this.logger.error(`Erreur lors de l'import de la base de données : ${error.message}`, error.stack);
      throw error;
    }
  }

  private async importSettings(tx: any, settings: any[]): Promise<void> {
    for (const setting of settings) {
      await tx.setting.create({
        data: setting,
      });
    }
  }

  private async importDocuments(tx: any, documents: any[]): Promise<void> {
    for (const document of documents) {
      await tx.document.create({
        data: {
          ...document,
          createdAt: new Date(document.createdAt),
          updatedAt: new Date(document.updatedAt),
        },
      });
    }
  }

  private async importImages(tx: any, images: any[]): Promise<void> {
    for (const image of images) {
      await tx.image.create({
        data: {
          ...image,
          createdAt: new Date(image.createdAt),
          updatedAt: new Date(image.updatedAt),
        },
      });
    }
  }

  private async importNews(tx: any, news: any[]): Promise<void> {
    for (const item of news) {
      await tx.news.create({
        data: {
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }
  }

  private async importEmailTemplates(tx: any, templates: any[]): Promise<void> {
    for (const template of templates) {
      await tx.emailTemplate.create({
        data: {
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
        },
      });
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      // Sauvegarder les super admins
      const superAdmins = await this.prisma.admin.findMany({
        where: { role: 'SUPER_ADMIN' },
      });

      // Transaction pour réinitialiser la base de données
      await this.prisma.$transaction(async (tx) => {
        // Supprimer toutes les données
        await tx.setting.deleteMany();
        await tx.document.deleteMany();
        await tx.image.deleteMany();
        await tx.news.deleteMany();
        await tx.emailTemplate.deleteMany();
        await tx.admin.deleteMany();

        // Restaurer uniquement les super admins
        if (superAdmins.length > 0) {
          for (const admin of superAdmins) {
            await tx.admin.create({
              data: admin,
            });
          }
        }

        // Créer un enregistrement pour le reset
        await tx.setting.create({
          data: {
            key: 'lastReset',
            value: new Date().toISOString(),
          },
        });
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la réinitialisation de la base de données : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      const [admins, documents, images, news, lastBackup] = await Promise.all([
        this.prisma.admin.count(),
        this.prisma.document.count(),
        this.prisma.image.count(),
        this.prisma.news.count(),
        this.prisma.setting.findFirst({
          where: { key: 'lastBackup' },
        }),
      ]);

      return {
        admins,
        documents,
        images,
        news,
        lastBackup: lastBackup?.value || null,
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des statistiques de la base de données : ${error.message}`, error.stack);
      throw error;
    }
  }
}