import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { UpdateInscriptionDto } from './dto/update-inscription.dto';
import { UpdateInscriptionStatusDto } from './dto/update-inscription-status.dto';
import { Inscription, StatutInscription } from '@prisma/client';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class InscriptionsService {
  private readonly logger = new Logger(InscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  async create(createInscriptionDto: CreateInscriptionDto): Promise<Inscription> {
    try {
      // Vérifier si la formation existe et a des places disponibles
      const formation = await this.prisma.formation.findUnique({
        where: { id: createInscriptionDto.formationId },
      });

      if (!formation) {
        throw new NotFoundException('Formation non trouvée');
      }

      if (formation.placesDisponibles <= 0) {
        throw new BadRequestException('Plus de places disponibles pour cette formation');
      }

      // Créer l'inscription
      const inscription = await this.prisma.inscription.create({
        data: {
          nom: createInscriptionDto.nom,
          prenom: createInscriptionDto.prenom,
          email: createInscriptionDto.email,
          telephone: createInscriptionDto.telephone,
          dateNaissance: new Date(createInscriptionDto.dateNaissance),
          message: createInscriptionDto.message,
          formationId: createInscriptionDto.formationId,
          statut: StatutInscription.EN_ATTENTE,
        },
        include: {
          formation: true,
        },
      });

      // Mettre à jour les places disponibles
      await this.prisma.formation.update({
        where: { id: createInscriptionDto.formationId },
        data: {
          placesDisponibles: {
            decrement: 1,
          },
        },
      });

      // 1. Envoyer un email de confirmation de réception au participant
      await this.emailsService.sendEmail({
        to: inscription.email,
        subject: `Confirmation de votre demande d'inscription - Formation ${formation.titre}`,
        template: 'INSCRIPTION',
        data: {
          prenom: inscription.prenom,
          nom: inscription.nom,
          formation: formation.titre,
          date: formation.date instanceof Date 
            ? formation.date.toLocaleDateString('fr-FR')
            : new Date(formation.date).toLocaleDateString('fr-FR'),
          lieu: formation.lieu,
          duree: formation.duree,
        },
      });

      // 2. Envoyer une notification aux administrateurs
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await this.emailsService.sendEmail({
          to: adminEmail,
          subject: `Nouvelle inscription - ${formation.titre}`,
          template: 'NOTIFICATION',
          data: {
            inscription: {
              id: inscription.id,
              nom: inscription.nom,
              prenom: inscription.prenom,
              email: inscription.email,
              telephone: inscription.telephone,
              dateNaissance: inscription.dateNaissance instanceof Date 
                ? inscription.dateNaissance.toLocaleDateString('fr-FR')
                : new Date(inscription.dateNaissance).toLocaleDateString('fr-FR'),
              message: inscription.message,
              statut: inscription.statut,
            },
            formation: {
              id: formation.id,
              titre: formation.titre,
              type: formation.type,
              date: formation.date instanceof Date 
                ? formation.date.toLocaleDateString('fr-FR')
                : new Date(formation.date).toLocaleDateString('fr-FR'),
              lieu: formation.lieu,
              placesDisponibles: formation.placesDisponibles,
            },
          },
        });
      }

      return inscription;
    } catch (error) {
      this.logger.error(`Erreur lors de la création d'une inscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(
    formationId?: string,
    status?: StatutInscription,
    search?: string,
  ): Promise<Inscription[]> {
    const whereClause: any = {};

    if (formationId) {
      whereClause.formationId = formationId;
    }

    if (status) {
      whereClause.statut = status;
    }

    if (search) {
      whereClause.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.inscription.findMany({
      where: whereClause,
      include: {
        formation: {
          select: {
            titre: true,
            type: true,
            date: true,
            duree: true,
            lieu: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Inscription & { formation: any }> {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
      include: {
        formation: true,
      },
    });

    if (!inscription) {
      throw new NotFoundException(`Inscription avec l'ID ${id} non trouvée`);
    }

    return inscription;
  }

  async update(id: string, updateInscriptionDto: UpdateInscriptionDto): Promise<Inscription> {
    // Vérifier si l'inscription existe
    await this.findOne(id);

    // Mise à jour de l'inscription
    const updatedInscription = await this.prisma.inscription.update({
      where: { id },
      data: {
        ...updateInscriptionDto,
        dateNaissance: updateInscriptionDto.dateNaissance 
          ? new Date(updateInscriptionDto.dateNaissance) 
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        formation: true,
      },
    });

    // Si le statut change, envoyer un email
    if (updateInscriptionDto.statut) {
      await this.handleStatusChange(
        updatedInscription, 
        updateInscriptionDto.statut
      );
    }

    return updatedInscription;
  }

  async updateStatus(id: string, updateStatusDto: UpdateInscriptionStatusDto): Promise<Inscription> {
    // Vérifier si l'inscription existe
    const inscription = await this.findOne(id);
    const previousStatus = inscription.statut;

    // Mettre à jour le statut
    const updatedInscription = await this.prisma.inscription.update({
      where: { id },
      data: {
        statut: updateStatusDto.statut,
        updatedAt: new Date(),
      },
      include: {
        formation: true,
      },
    });

    // 3. Si le statut a changé, envoyer un email
    if (previousStatus !== updateStatusDto.statut) {
      await this.handleStatusChange(updatedInscription, updateStatusDto.statut);
    }

    return updatedInscription;
  }

  async remove(id: string): Promise<void> {
    // Vérifier si l'inscription existe
    const inscription = await this.findOne(id);
    const formation = inscription.formation;

    // Si l'inscription était acceptée, incrémenter le nombre de places disponibles
    if (inscription.statut === StatutInscription.ACCEPTEE) {
      await this.prisma.formation.update({
        where: { id: inscription.formationId },
        data: {
          placesDisponibles: {
            increment: 1,
          },
        },
      });
    }

    // Supprimer l'inscription
    await this.prisma.inscription.delete({
      where: { id },
    });

    // 4. Envoyer un email d'annulation
    await this.emailsService.sendEmail({
      to: inscription.email,
      subject: `Annulation de votre inscription - ${formation.titre}`,
      template: 'INSCRIPTION_ANNULEE',
      data: {
        prenom: inscription.prenom,
        nom: inscription.nom,
        formation: formation.titre,
        date: formation.date instanceof Date
          ? formation.date.toLocaleDateString('fr-FR')
          : new Date(formation.date).toLocaleDateString('fr-FR'),
      },
    });
  }

  // Méthode utilitaire pour gérer les changements de statut
  private async handleStatusChange(
    inscription: Inscription & { formation: any },
    newStatus: StatutInscription,
  ): Promise<void> {
    try {
      // S'assurer que la formation est disponible
      const formation = inscription.formation || 
        await this.prisma.formation.findUnique({
          where: { id: inscription.formationId }
        });

      if (!formation) {
        this.logger.error(`Formation non trouvée pour l'inscription ${inscription.id}`);
        return;
      }

      // Formater la date pour l'affichage
      const formattedDate = formation.date instanceof Date
        ? formation.date.toLocaleDateString('fr-FR')
        : new Date(formation.date).toLocaleDateString('fr-FR');

      switch (newStatus) {
        case StatutInscription.ACCEPTEE:
          // Mise à jour du nombre de places si ce n'était pas déjà accepté
          if (inscription.statut !== StatutInscription.ACCEPTEE) {
            await this.prisma.formation.update({
              where: { id: inscription.formationId },
              data: {
                placesDisponibles: {
                  decrement: 1,
                },
              },
            });
          }

          // Envoyer un email d'acceptation
          await this.emailsService.sendEmail({
            to: inscription.email,
            subject: `Confirmation d'inscription - ${formation.titre}`,
            template: 'INSCRIPTION_ACCEPTEE',
            data: {
              prenom: inscription.prenom,
              nom: inscription.nom,
              formation: formation.titre,
              date: formattedDate,
              lieu: formation.lieu,
              duree: formation.duree,
              prix: formation.prix,
            },
          });
          break;

        case StatutInscription.REFUSEE:
          // Incrementer le nombre de places si c'était accepté avant
          if (inscription.statut === StatutInscription.ACCEPTEE) {
            await this.prisma.formation.update({
              where: { id: inscription.formationId },
              data: {
                placesDisponibles: {
                  increment: 1,
                },
              },
            });
          }

          // Envoyer un email de refus
          await this.emailsService.sendEmail({
            to: inscription.email,
            subject: `Inscription refusée - ${formation.titre}`,
            template: 'INSCRIPTION_REFUSEE',
            data: {
              prenom: inscription.prenom,
              nom: inscription.nom,
              formation: formation.titre,
            },
          });
          break;

        case StatutInscription.ANNULEE:
          // Incrementer le nombre de places si c'était accepté avant
          if (inscription.statut === StatutInscription.ACCEPTEE) {
            await this.prisma.formation.update({
              where: { id: inscription.formationId },
              data: {
                placesDisponibles: {
                  increment: 1,
                },
              },
            });
          }

          // Envoyer un email d'annulation
          await this.emailsService.sendEmail({
            to: inscription.email,
            subject: `Annulation de votre inscription - ${formation.titre}`,
            template: 'INSCRIPTION_ANNULEE',
            data: {
              prenom: inscription.prenom,
              nom: inscription.nom,
              formation: formation.titre,
              date: formattedDate,
            },
          });
          break;
      }

      // Marquer comme notifié
      await this.prisma.inscription.update({
        where: { id: inscription.id },
        data: { notifie: true },
      });
    } catch (error) {
      this.logger.error(`Erreur lors du traitement du changement de statut: ${error.message}`, error.stack);
      // Ne pas interrompre le workflow si l'envoi d'email échoue
    }
  }
}