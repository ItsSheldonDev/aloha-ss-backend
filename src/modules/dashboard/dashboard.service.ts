import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<any> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Récupérer les statistiques principales
      const [
        totalFormations,
        activeFormations,
        cancelledFormations,
        totalInscriptions,
        acceptedInscriptions,
        pendingInscriptions,
        refusedInscriptions,
        todayInscriptions,
        weekInscriptions,
        monthInscriptions,
        lastMonthInscriptions,
        totalUsers,
        totalDocuments,
        totalDownloads,
        totalImages,
      ] = await Promise.all([
        // Formations
        this.prisma.formation.count(),
        this.prisma.formation.count({
          where: {
            statut: {
              in: ['PLANIFIEE', 'EN_COURS'],
            },
          },
        }),
        this.prisma.formation.count({
          where: {
            statut: 'ANNULEE',
          },
        }),

        // Inscriptions
        this.prisma.inscription.count(),
        this.prisma.inscription.count({
          where: {
            statut: 'ACCEPTEE',
          },
        }),
        this.prisma.inscription.count({
          where: {
            statut: 'EN_ATTENTE',
          },
        }),
        this.prisma.inscription.count({
          where: {
            statut: 'REFUSEE',
          },
        }),
        this.prisma.inscription.count({
          where: {
            createdAt: {
              gte: startOfToday,
            },
          },
        }),
        this.prisma.inscription.count({
          where: {
            createdAt: {
              gte: startOfWeek,
            },
          },
        }),
        this.prisma.inscription.count({
          where: {
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
        this.prisma.inscription.count({
          where: {
            createdAt: {
              gte: startOfLastMonth,
              lt: startOfMonth,
            },
          },
        }),

        // Utilisateurs, documents et images
        this.prisma.admin.count(),
        this.prisma.document.count(),
        this.prisma.document.aggregate({
          _sum: {
            downloads: true,
          },
        }),
        this.prisma.image.count(),
      ]);

      // Récupérer les inscriptions récentes
      const recentInscriptions = await this.prisma.inscription.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          formation: {
            select: {
              titre: true,
              type: true,
              date: true,
            },
          },
        },
      });

      // Statistiques par type de formation
      const formationsByType = await this.prisma.formation.groupBy({
        by: ['type'],
        _count: {
          id: true,
        },
      });

      // Inscriptions par mois (12 derniers mois)
      const inscriptionsByMonth = await this.getInscriptionsByMonth();

      // Taux d'occupation des formations
      const occupationRate = await this.getOccupationRate();

      // Obtenir les formations à venir
      const upcomingFormations = await this.prisma.formation.findMany({
        where: {
          date: {
            gte: new Date(),
          },
          statut: {
            in: ['PLANIFIEE', 'EN_COURS'],
          },
        },
        orderBy: {
          date: 'asc',
        },
        take: 5,
        include: {
          _count: {
            select: { inscriptions: true },
          },
        },
      });

      // Obtenir la répartition des statuts d'inscription
      const inscriptionStatusDistribution = [
        { status: 'ACCEPTEE', count: acceptedInscriptions },
        { status: 'EN_ATTENTE', count: pendingInscriptions },
        { status: 'REFUSEE', count: refusedInscriptions },
      ];

      // Assembler les statistiques complètes
      return {
        overview: {
          totalFormations,
          activeFormations,
          cancelledFormations,
          totalInscriptions,
          acceptedInscriptions,
          pendingInscriptions,
          totalUsers,
          totalDocuments,
          totalDownloads: totalDownloads._sum.downloads || 0,
          totalImages,
        },
        comparison: {
          inscriptionsToday: todayInscriptions,
          inscriptionsThisWeek: weekInscriptions,
          inscriptionsThisMonth: monthInscriptions,
          inscriptionsLastMonth: lastMonthInscriptions,
          monthlyGrowth: this.calculateGrowthRate(monthInscriptions, lastMonthInscriptions),
        },
        recentActivity: {
          recentInscriptions,
          upcomingFormations,
        },
        charts: {
          formationsByType,
          inscriptionsByMonth,
          occupationRate,
          inscriptionStatusDistribution,
        },
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des statistiques : ${error.message}`, error.stack);
      throw error;
    }
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private async getInscriptionsByMonth(): Promise<any[]> {
    // Récupérer les données pour les 12 derniers mois
    const now = new Date();
    // Définir explicitement le type pour months
    const months: { start: Date; end: Date }[] = [];
    const result = [];
  
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({ start: month, end: monthEnd });
    }
  
    // Récupérer les données en parallèle
    const promises = months.map(async ({ start, end }) => {
      const count = await this.prisma.inscription.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });
  
      return {
        month: `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}`,
        count,
      };
    });
  
    return Promise.all(promises);
  }

  private async getOccupationRate(): Promise<any[]> {
    // Récupérer les formations actives
    const activeFormations = await this.prisma.formation.findMany({
      where: {
        statut: {
          in: ['PLANIFIEE', 'EN_COURS'],
        },
        date: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        titre: true,
        type: true,
        date: true,
        placesTotal: true,
        placesDisponibles: true,
      },
    });

    // Calculer le taux d'occupation pour chaque formation
    return activeFormations.map((formation) => {
      const occupied = formation.placesTotal - formation.placesDisponibles;
      const occupationRate = (occupied / formation.placesTotal) * 100;

      return {
        id: formation.id,
        titre: formation.titre,
        type: formation.type,
        date: formation.date,
        places: {
          total: formation.placesTotal,
          occupied,
          available: formation.placesDisponibles,
        },
        occupationRate: Math.round(occupationRate),
      };
    });
  }

  async getYearlyStats(): Promise<any> {
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear];
      
      // Récupérer les données pour les 3 dernières années
      const yearlyData = await Promise.all(
        years.map(async (year) => {
          const startOfYear = new Date(year, 0, 1);
          const endOfYear = new Date(year, 11, 31, 23, 59, 59);
          
          const [inscriptions, formations] = await Promise.all([
            this.prisma.inscription.count({
              where: {
                createdAt: {
                  gte: startOfYear,
                  lte: endOfYear,
                },
              },
            }),
            this.prisma.formation.count({
              where: {
                date: {
                  gte: startOfYear,
                  lte: endOfYear,
                },
              },
            }),
          ]);
          
          return {
            year,
            inscriptions,
            formations,
          };
        })
      );
      
      return yearlyData;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des statistiques annuelles : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInscriptionTrends(): Promise<any> {
    try {
      // Récupérer les données pour chaque type de formation
      const inscriptionsByTypeRaw: Array<{ type: string; count: bigint }> = await this.prisma.$queryRaw`
        SELECT f."type", COUNT(i.id) as count
        FROM "Inscription" i
        JOIN "Formation" f ON i."formationId" = f.id
        WHERE i."createdAt" > NOW() - INTERVAL '12 months'
        GROUP BY f."type"
        ORDER BY count DESC
      `;
  
      // Convertir les BigInt en nombres JavaScript
      const inscriptionsByType = inscriptionsByTypeRaw.map(item => ({
        type: item.type,
        count: Number(item.count)
      }));
  
      // Tendances d'inscriptions par mois et par type
      const monthlyTrendsByTypeRaw: Array<{ month: Date; type: string; count: bigint }> = await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', i."createdAt") as month,
          f."type",
          COUNT(i.id) as count
        FROM "Inscription" i
        JOIN "Formation" f ON i."formationId" = f.id
        WHERE i."createdAt" > NOW() - INTERVAL '12 months'
        GROUP BY month, f."type"
        ORDER BY month ASC, f."type"
      `;
  
      // Convertir les BigInt en nombres JavaScript et formater la date
      const monthlyTrendsByType = monthlyTrendsByTypeRaw.map(item => ({
        month: item.month instanceof Date ? item.month.toISOString() : item.month,
        type: item.type,
        count: Number(item.count)
      }));
  
      return {
        inscriptionsByType,
        monthlyTrendsByType
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des tendances d'inscription : ${error.message}`, error.stack);
      throw error;
    }
  }
}