// src/modules/emails/emails.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface SendEmailOptions {
  to: string;
  subject: string;
  template: EmailType | string;
  data?: any;
}

@Injectable()
export class EmailsService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailsService.name);
  private readonly templatesDir = path.join(process.cwd(), 'src', 'templates', 'emails');

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', { infer: true }) || true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    // Créer le dossier des templates s'il n'existe pas
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
      this.logger.log(`Dossier des templates créé ou déjà existant : ${this.templatesDir}`);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      let htmlContent: string;
      let subject = options.subject;

      // Mapper les types d'email aux fichiers de template
      const templateMap: { [key in EmailType | string]: string } = {
        'NOTIFICATION_SAUVE_TAGE_SPORTIF': 'notification-sauvetage-sportif.html',
        'CONFIRMATION_CONTACT': 'confirmation-contact.html',
        'NOTIFICATION_CONTACT': 'notification-contact.html',
        'CONFIRMATION_SIGNALEMENT': 'confirmation-signalement.html',
        'NOTIFICATION_SIGNALEMENT': 'notification-signalement.html',
      };

      // Si le template est dans la liste des templates connus
      if (typeof options.template === 'string' && templateMap[options.template]) {
        const templateFile = templateMap[options.template];
        const templatePath = path.join(this.templatesDir, templateFile);

        try {
          // Essayer de lire le fichier template
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          const template = Handlebars.compile(templateContent);
          htmlContent = template(options.data || {});
        } catch (fileError) {
          this.logger.warn(`Template file ${templateFile} not found, falling back to database: ${fileError.message}`);

          // Chercher dans la base de données si le fichier n'existe pas
          const emailTemplate = await this.prisma.emailTemplate.findFirst({
            where: {
              type: options.template as EmailType,
              active: true,
            },
          });

          if (!emailTemplate) {
            throw new Error(`Template email ${options.template} non trouvé ou inactif`);
          }

          const template = Handlebars.compile(emailTemplate.content);
          htmlContent = template(options.data || {});
          subject = subject || emailTemplate.subject;
        }
      } else {
        // Si ce n'est pas un template connu, utiliser le contenu fourni directement
        htmlContent = options.template as string;
      }

      // Vérifier que le destinataire est valide
      if (!options.to || !options.to.includes('@')) {
        throw new Error('Adresse email du destinataire invalide');
      }

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
        to: options.to,
        subject: subject,
        html: htmlContent,
      });

      this.logger.log(`Email envoyé avec succès à ${options.to} avec le sujet : ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Échec de l'envoi de l'email : ${error.message}`, error.stack);
      return false;
    }
  }
}