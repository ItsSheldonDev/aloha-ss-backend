// src/modules/inscriptions/inscriptions.controller.ts
import {
  Controller,
  Post,
  Body,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InscriptionsService } from './inscriptions.service';

@ApiTags('inscriptions')
@Controller('inscriptions')
export class InscriptionsController {
  private readonly logger = new Logger(InscriptionsController.name);

  constructor(private readonly inscriptionsService: InscriptionsService) {}

  @Post('sauvetage-sportif')
  @ApiOperation({ summary: 'Envoyer une inscription pour Sauvetage Sportif (accès public)' })
  @ApiResponse({ status: 200, description: 'Inscription envoyée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async sendSauvetageSportifInscription(@Body() body: { firstname: string; name: string; email: string; phone: string; birthdate: string; observation: string }) {
    this.logger.log(`Requête POST reçue pour /inscriptions/sauvetage-sportif avec body: ${JSON.stringify(body)}`);
    return this.inscriptionsService.sendSauvetageSportifInscription(body);
  }

  @Post('contact')
  @ApiOperation({ summary: 'Envoyer un message via le formulaire de contact (accès public)' })
  @ApiResponse({ status: 200, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async sendContactForm(@Body() body: { name: string; email: string; subject: string; message: string }) {
    this.logger.log(`Requête POST reçue pour /inscriptions/contact avec body: ${JSON.stringify(body)}`);
    return this.inscriptionsService.sendContactForm(body);
  }

  @Post('signalement')
  @ApiOperation({ summary: 'Envoyer un signalement (accès public)' })
  @ApiResponse({ status: 200, description: 'Signalement envoyé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async sendSignalement(@Body() body: { name: string; email: string; type: string; details: string; location: string }) {
    this.logger.log(`Requête POST reçue pour /inscriptions/signalement avec body: ${JSON.stringify(body)}`);
    return this.inscriptionsService.sendSignalement(body);
  }
}