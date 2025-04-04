// src/modules/inscriptions/inscriptions.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class InscriptionsService {
  private readonly logger = new Logger(InscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  async sendSauvetageSportifInscription(body: { firstname: string; name: string; email: string; phone: string; birthdate: string; observation: string }): Promise<{ message: string }> {
    try {
      // Validation des données
      if (!body.firstname || !body.name || !body.email || !body.phone || !body.birthdate) {
        throw new BadRequestException('Tous les champs obligatoires (firstname, name, email, phone, birthdate) doivent être remplis');
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        throw new BadRequestException('Adresse email de l\'admin non configurée');
      }

      // Envoyer un email à l'admin
      await this.emailsService.sendEmail({
        to: adminEmail,
        subject: 'Nouvelle inscription - Sauvetage Sportif',
        template: 'NOTIFICATION_SAUVE_TAGE_SPORTIF',
        data: {
          inscription: {
            firstname: body.firstname,
            name: body.name,
            email: body.email,
            phone: body.phone,
            birthdate: new Date(body.birthdate).toLocaleDateString('fr-FR'),
            observation: body.observation || '',
          },
        },
      });

      // Envoyer un email de confirmation au client
      await this.emailsService.sendEmail({
        to: body.email,
        subject: 'Confirmation de votre demande d\'inscription - Sauvetage Sportif',
        template: 'CONFIRMATION_INSCRIPTION',
        data: {
          prenom: body.firstname,
          nom: body.name,
        },
      });

      return { message: 'Inscription envoyée avec succès' };
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'inscription Sauvetage Sportif: ${error.message}`, error.stack);
      throw new BadRequestException(`Erreur lors de l'envoi de l'inscription: ${error.message}`);
    }
  }

  async sendContactForm(body: { name: string; email: string; subject: string; message: string }): Promise<{ message: string }> {
    try {
      // Validation des données
      if (!body.name || !body.email || !body.subject || !body.message) {
        throw new BadRequestException('Tous les champs sont obligatoires');
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        throw new BadRequestException('Adresse email de l\'admin non configurée');
      }

      // Envoyer un email à l'admin
      await this.emailsService.sendEmail({
        to: adminEmail,
        subject: `Nouveau message de contact: ${body.subject}`,
        template: 'NOTIFICATION_CONTACT',
        data: {
          contact: {
            name: body.name,
            email: body.email,
            subject: body.subject,
            message: body.message,
            date: new Date().toLocaleDateString('fr-FR'),
          },
        },
      });

      // Envoyer un email de confirmation au client
      await this.emailsService.sendEmail({
        to: body.email,
        subject: 'Confirmation de réception de votre message',
        template: 'CONFIRMATION_CONTACT',
        data: {
          name: body.name,
          subject: body.subject,
        },
      });

      return { message: 'Message envoyé avec succès' };
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du formulaire de contact: ${error.message}`, error.stack);
      throw new BadRequestException(`Erreur lors de l'envoi du message: ${error.message}`);
    }
  }

  async sendSignalement(body: { name: string; email: string; type: string; details: string; location: string }): Promise<{ message: string }> {
    try {
      // Validation des données
      if (!body.name || !body.email || !body.type || !body.details) {
        throw new BadRequestException('Les champs nom, email, type et détails sont obligatoires');
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        throw new BadRequestException('Adresse email de l\'admin non configurée');
      }

      // Envoyer un email à l'admin
      await this.emailsService.sendEmail({
        to: adminEmail,
        subject: `Nouveau signalement: ${body.type}`,
        template: 'NOTIFICATION_SIGNALEMENT',
        data: {
          signalement: {
            name: body.name,
            email: body.email,
            type: body.type,
            details: body.details,
            location: body.location || 'Non spécifié',
            date: new Date().toLocaleDateString('fr-FR'),
          },
        },
      });

      // Envoyer un email de confirmation au client
      await this.emailsService.sendEmail({
        to: body.email,
        subject: 'Confirmation de votre signalement',
        template: 'CONFIRMATION_SIGNALEMENT',
        data: {
          name: body.name,
          type: body.type,
        },
      });

      return { message: 'Signalement envoyé avec succès' };
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du signalement: ${error.message}`, error.stack);
      throw new BadRequestException(`Erreur lors de l'envoi du signalement: ${error.message}`);
    }
  }
}