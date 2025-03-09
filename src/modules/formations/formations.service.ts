import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Formation, TypeFormation, StatutFormation } from '@prisma/client';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { UpdateFormationStatusDto } from './dto/update-formation-status.dto';

@Injectable()
export class FormationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    type?: TypeFormation,
    month?: string,
    status?: StatutFormation,
    publicOnly: boolean = false
  ): Promise<Formation[]> {
    let whereClause: any = {};
    
    if (publicOnly) {
      // Filtre pour les formations publiques (accessible sans authentification)
      whereClause = {
        statut: {
          in: ['PLANIFIEE', 'EN_COURS']
        },
        date: {
          gte: new Date()
        }
      };
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(+year, +monthNum - 1, 1);
      const endDate = new Date(+year, +monthNum, 0);
      
      whereClause.date = {
        ...(whereClause.date || {}),
        gte: startDate,
        lte: endDate
      };
    }
    
    if (status) {
      whereClause.statut = status;
    }
    
    return this.prisma.formation.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { inscriptions: true }
        }
      }
    });
  }

  async findOne(id: string): Promise<any> {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: {
        inscriptions: true
      }
    });

    if (!formation) {
      throw new NotFoundException(`Formation avec l'ID ${id} non trouvée`);
    }

    return formation;
  }

  async create(data: CreateFormationDto): Promise<Formation> {
    // Validation supplémentaire si nécessaire
    return this.prisma.formation.create({
      data: {
        ...data,
        placesDisponibles: data.placesTotal,
        statut: StatutFormation.PLANIFIEE
      }
    });
  }

  async update(id: string, data: UpdateFormationDto): Promise<Formation> {
    // Vérifier si la formation existe
    await this.findOne(id);

    return this.prisma.formation.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async updateStatus(id: string, data: UpdateFormationStatusDto): Promise<Formation> {
    // Vérifier si la formation existe
    await this.findOne(id);

    return this.prisma.formation.update({
      where: { id },
      data: {
        statut: data.statut,
        updatedAt: new Date()
      }
    });
  }

  async remove(id: string): Promise<void> {
    // Vérifier si la formation existe
    const formation = await this.findOne(id);

    // Vérifier s'il y a des inscriptions associées
    const inscriptionCount = await this.prisma.inscription.count({
      where: { formationId: id }
    });

    if (inscriptionCount > 0) {
      throw new BadRequestException('Impossible de supprimer une formation avec des inscriptions');
    }

    await this.prisma.formation.delete({
      where: { id }
    });
  }
}