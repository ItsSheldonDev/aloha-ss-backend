import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<any> {
    try {
      const settings = await this.prisma.setting.findMany();
      
      // Convertir le format plat de la base de données en format structuré
      const formattedSettings = {
        contact: {
          email: this.getSettingValue(settings, 'contact.email', ''),
          phone: this.getSettingValue(settings, 'contact.phone', ''),
          address: this.getSettingValue(settings, 'contact.address', ''),
        },
        social: {
          facebook: this.getSettingValue(settings, 'social.facebook', ''),
          instagram: this.getSettingValue(settings, 'social.instagram', ''),
        },
        notifications: {
          emailInscription: this.getSettingValue(settings, 'notifications.emailInscription', 'true') === 'true',
          emailContact: this.getSettingValue(settings, 'notifications.emailContact', 'true') === 'true',
        },
      };

      return formattedSettings;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des paramètres : ${error.message}`, error.stack);
      throw error;
    }
  }

  private getSettingValue(settings: any[], key: string, defaultValue: string): string {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<any> {
    try {
      // Convertir le format structuré en format plat pour la base de données
      const flattenedSettings = this.flattenSettings(updateSettingsDto);
      
      // Mettre à jour chaque paramètre
      for (const [key, value] of Object.entries(flattenedSettings)) {
        await this.prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }

      return this.getSettings();
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour des paramètres : ${error.message}`, error.stack);
      throw error;
    }
  }

  private flattenSettings(settings: UpdateSettingsDto): Record<string, string> {
    const result: Record<string, string> = {};

    if (settings.contact) {
      if (settings.contact.email !== undefined) result['contact.email'] = settings.contact.email;
      if (settings.contact.phone !== undefined) result['contact.phone'] = settings.contact.phone;
      if (settings.contact.address !== undefined) result['contact.address'] = settings.contact.address;
    }

    if (settings.social) {
      if (settings.social.facebook !== undefined) result['social.facebook'] = settings.social.facebook;
      if (settings.social.instagram !== undefined) result['social.instagram'] = settings.social.instagram;
    }

    if (settings.notifications) {
      if (settings.notifications.emailInscription !== undefined) 
        result['notifications.emailInscription'] = settings.notifications.emailInscription.toString();
      if (settings.notifications.emailContact !== undefined) 
        result['notifications.emailContact'] = settings.notifications.emailContact.toString();
    }

    return result;
  }
}