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
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS')
      }
    });

    // Créer le dossier des templates s'il n'existe pas
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      let htmlContent: string;

      // Mapper le type d'email au fichier de template
      const templateMap = {
        'INSCRIPTION': 'inscription-recue.html',
        'INSCRIPTION_ACCEPTEE': 'inscription-acceptee.html',
        'INSCRIPTION_REFUSEE': 'inscription-refusee.html',
        'INSCRIPTION_ANNULEE': 'inscription-annulee.html',
        'NOTIFICATION': 'notification-admin.html',
      };

      // Si c'est un type d'email connu, chercher le template dans la base de données ou dans les fichiers
      if (typeof options.template === 'string' && templateMap[options.template]) {
        try {
          // Essayer de lire le fichier template
          const templatePath = path.join(this.templatesDir, templateMap[options.template]);
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          const template = Handlebars.compile(templateContent);
          htmlContent = template(options.data || {});
        } catch (fileError) {
          this.logger.warn(`Template file not found, falling back to database: ${fileError.message}`);
          
          // Si le fichier n'existe pas, chercher dans la base de données
          const emailTemplate = await this.prisma.emailTemplate.findFirst({
            where: {
              type: options.template as EmailType,
              active: true
            }
          });

          if (!emailTemplate) {
            throw new Error(`Template email ${options.template} non trouvé ou inactif`);
          }

          const template = Handlebars.compile(emailTemplate.content);
          htmlContent = template(options.data || {});
          options.subject = options.subject || emailTemplate.subject;
        }
      } else {
        // Sinon, considérer que le template est le contenu HTML
        htmlContent = options.template;
      }

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_USER'),
        to: options.to,
        subject: options.subject,
        html: htmlContent
      });

      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }
}