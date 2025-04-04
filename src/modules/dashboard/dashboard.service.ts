// src/modules/dashboard/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FormationsService } from '../formations/formations.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly formationsService: FormationsService
  ) {}

  async getStats(): Promise<any> {
    try {
      // Récupérer les formations depuis le service formations (fichier Excel)
      const formations = await this.formationsService.findAll();

      // Récupérer les statistiques principales
      const [
        totalAdmins,
        totalDocuments,
        totalDownloads,
        totalImages,
        totalNews
      ] = await Promise.all([
        // Administrateurs
        this.prisma.admin.count(),

        // Documents
        this.prisma.document.count(),

        // Téléchargements
        this.prisma.document.aggregate({
          _sum: {
            downloads: true,
          },
        }),

        // Images
        this.prisma.image.count(),

        // Actualités
        this.prisma.news.count({
          where: {
            published: true,
          },
        }),
      ]);

      // Calculer les statistiques des formations
      const activeFormations = formations.filter(f => 
        f.statut === 'PLANIFIEE' || f.statut === 'EN_COURS'
      );

      // Récupérer les formations à venir
      const upcomingFormations = formations
        .filter(f => {
          // Filtre formations futures, triées par date
          const now = new Date();
          return f.dateDebut > now && (f.statut === 'PLANIFIEE' || f.statut === 'EN_COURS');
        })
        .sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime())
        .slice(0, 5); // Limiter à 5 formations

      // Statistiques par type de formation
      const formationsByType = this.getFormationsByType(formations);

      // Assembler les statistiques complètes
      return {
        overview: {
          totalFormations: formations.length,
          activeFormations: activeFormations.length,
          totalAdmins,
          totalDocuments,
          totalDownloads: totalDownloads._sum.downloads || 0,
          totalImages,
          totalNews,
        },
        comparison: {
          formationsThisMonth: this.getFormationsInCurrentMonth(formations).length,
          formationsLastMonth: this.getFormationsInLastMonth(formations).length,
          formationsThisYear: this.getFormationsInCurrentYear(formations).length,
          formationsLastYear: this.getFormationsInLastYear(formations).length,
        },
        recentActivity: {
          upcomingFormations,
        },
        charts: {
          formationsByType,
          formationsByMonth: this.getFormationsByMonth(formations),
          categoriesDistribution: await this.getCategoriesDistribution(),
        },
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des statistiques : ${error.message}`, error.stack);
      throw error;
    }
  }

  private getFormationsByType(formations: any[]): any[] {
    const typeCount: Record<string, number> = {};
    
    formations.forEach(formation => {
      const type = formation.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count
    }));
  }

  private getFormationsInCurrentMonth(formations: any[]): any[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return formations.filter(formation => {
      const date = new Date(formation.dateDebut);
      return date >= startOfMonth && date <= endOfMonth;
    });
  }

  private getFormationsInLastMonth(formations: any[]): any[] {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    return formations.filter(formation => {
      const date = new Date(formation.dateDebut);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });
  }

  private getFormationsInCurrentYear(formations: any[]): any[] {
    const year = new Date().getFullYear();
    
    return formations.filter(formation => {
      const date = new Date(formation.dateDebut);
      return date.getFullYear() === year;
    });
  }

  private getFormationsInLastYear(formations: any[]): any[] {
    const lastYear = new Date().getFullYear() - 1;
    
    return formations.filter(formation => {
      const date = new Date(formation.dateDebut);
      return date.getFullYear() === lastYear;
    });
  }

  private getFormationsByMonth(formations: any[]): any[] {
    const now = new Date();
    const months: { start: Date; end: Date; name: string }[] = [];
    const result: Array<{ month: string; count: number }> = [];
  
    // Créer les plages de dates pour les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = month.toLocaleDateString('fr-FR', { month: 'short' });
      months.push({ start: month, end: monthEnd, name: monthName });
    }
  
    // Compter les formations par mois
    months.forEach(({ start, end, name }) => {
      const count = formations.filter(formation => {
        const date = new Date(formation.dateDebut);
        return date >= start && date <= end;
      }).length;
  
      result.push({
        month: name,
        count,
      });
    });
  
    return result;
  }

  private async getCategoriesDistribution(): Promise<any[]> {
    // Compter les éléments par catégorie
    const [
      documentCategories,
      imageCategories
    ] = await Promise.all([
      // Distribution des catégories de documents
      this.prisma.document.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
      }),
      
      // Distribution des catégories d'images
      this.prisma.image.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Formater les résultats
    return [
      ...documentCategories.map(item => ({
        category: `Document - ${item.category}`,
        count: item._count.id,
      })),
      ...imageCategories.map(item => ({
        category: `Image - ${item.category}`,
        count: item._count.id,
      })),
    ];
  }

  async getYearlyStats(): Promise<any> {
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear];
      
      // Récupérer les formations
      const allFormations = await this.formationsService.findAll();
      
      // Récupérer les données pour les 3 dernières années
      const yearlyData = years.map(year => {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);
        
        const formations = allFormations.filter(f => {
          const date = new Date(f.dateDebut);
          return date >= startOfYear && date <= endOfYear;
        });
        
        return {
          year,
          formations: formations.length,
          documents: 0,  // À calculer si nécessaire
          images: 0,     // À calculer si nécessaire
          news: 0,       // À calculer si nécessaire
        };
      });
      
      return yearlyData;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des statistiques annuelles : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFormationTrends(): Promise<any> {
    try {
      // Récupérer les formations
      const allFormations = await this.formationsService.findAll();
      
      // Comptage par type
      const formationsByType = this.getFormationsByType(allFormations);
      
      // Tendances mensuelles par type
      const monthlyTrendsByType = this.getMonthlyTrendsByType(allFormations);
      
      return {
        formationsByType,
        monthlyTrendsByType
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des tendances de formation : ${error.message}`, error.stack);
      throw error;
    }
  }

  private getMonthlyTrendsByType(formations: any[]): any[] {
    // Récupérer tous les types de formation
    const allTypes = Array.from(new Set(formations.map(f => f.type)));
    
    // Créer les plages de date pour les 12 derniers mois
    const now = new Date();
    const months: { start: Date; end: Date; yearMonth: string }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      months.push({ start: month, end: monthEnd, yearMonth });
    }
    
    // Résultats
    const result: Array<{ month: string; type: string; count: number }> = [];
    
    // Pour chaque mois et type
    months.forEach(({ start, end, yearMonth }) => {
      allTypes.forEach(type => {
        const count = formations.filter(f => {
          const date = new Date(f.dateDebut);
          return f.type === type && date >= start && date <= end;
        }).length;
        
        result.push({
          month: yearMonth,
          type,
          count
        });
      });
    });
    
    return result;
  }
}