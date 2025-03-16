// src/modules/formations/formations.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Exporter l'interface FormattedFormation
export interface FormattedFormation {
  id: string;
  titre: string;
  type: string;
  dateDebut: Date;
  dateFin: Date;
  description: string | null;
  duree: string;
  prix: number | string;
  statut: string;
}

// Interface pour les lignes Excel
interface ExcelRow {
  [key: string]: any;
}

@Injectable()
export class FormationsService {
  private readonly logger = new Logger(FormationsService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'public/uploads/excel');
  private readonly excelFilename = 'RECAP_FORMATIONS_pour_site.xlsx';

  constructor(private readonly prisma: PrismaService) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      this.logger.log(`Répertoire créé ou vérifié: ${this.uploadsDir}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la création du répertoire: ${error.message}`);
    }
  }

  // Extraire le type de formation depuis le titre
  private extractType(titre: string): string {
    if (!titre) return "AUTRE";
    
    const titreLC = titre.toLowerCase();
    if (titreLC.includes("psc1") || titreLC.includes("psc")) return "PSC1";
    if (titreLC.includes("pse1")) return "PSE1";
    if (titreLC.includes("pse2")) return "PSE2";
    if (titreLC.includes("bnssa")) return "BNSSA";
    if (titreLC.includes("ssa") && !titreLC.includes("bnssa")) return "SSA";
    if (titreLC.includes("sst")) return "SST";
    if (titreLC.includes("bsb")) return "BSB";
    if (titreLC.includes("gqs")) return "GQS";
    if (titreLC.includes("formateur")) return "FORMATEUR";
    if (titreLC.includes("recyclage") || titreLC.includes("continue")) return "RECYCLAGE";
    if (titreLC.includes("permis côtier") || titreLC.includes("permis cotier")) return "PERMIS";
    return "AUTRE";
  }

  async uploadExcelFile(file: Express.Multer.File): Promise<{ success: boolean; message: string }> {
    try {
      if (!file) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      // Vérification du type MIME
      if (!file.mimetype.includes('spreadsheetml') && 
          !file.mimetype.includes('excel') && 
          !file.originalname.endsWith('.xlsx') && 
          !file.originalname.endsWith('.xls')) {
        throw new BadRequestException('Le fichier doit être au format Excel (.xlsx ou .xls)');
      }

      // Sauvegarder le fichier
      const filePath = path.join(this.uploadsDir, this.excelFilename);
      await fs.writeFile(filePath, file.buffer);

      // Vérifier si le fichier peut être lu correctement
      const formations = await this.parseExcelFile();
      
      this.logger.log(`Fichier Excel téléchargé avec succès: ${this.excelFilename} - ${formations.length} formations trouvées`);
      return { 
        success: true, 
        message: `Fichier Excel téléchargé avec succès. ${formations.length} formations importées.` 
      };
    } catch (error) {
      this.logger.error(`Erreur lors du téléchargement du fichier Excel: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(type?: string, period?: string): Promise<FormattedFormation[]> {
    try {
      const formations = await this.parseExcelFile();
      
      // Filtrer les formations si des filtres sont spécifiés
      let filteredFormations = formations;
      
      if (type && type !== 'all') {
        filteredFormations = filteredFormations.filter(formation => formation.type === type);
      }
      
      if (period && period !== 'all') {
        const currentDate = new Date();
        
        switch(period) {
          case '2025':
            filteredFormations = filteredFormations.filter(formation => 
              formation.dateDebut.getFullYear() === 2025
            );
            break;
          case '2024':
            filteredFormations = filteredFormations.filter(formation => 
              formation.dateDebut.getFullYear() === 2024
            );
            break;
          case 'recent':
            // Les 3 prochains mois
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(currentDate.getMonth() + 3);
            filteredFormations = filteredFormations.filter(formation => 
              formation.dateDebut >= currentDate && formation.dateDebut <= threeMonthsLater
            );
            break;
        }
      }
      
      return filteredFormations;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des formations: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        return []; // Retourner un tableau vide si le fichier n'existe pas encore
      }
      throw error;
    }
  }

  private async parseExcelFile(): Promise<FormattedFormation[]> {
    try {
      const filePath = path.join(this.uploadsDir, this.excelFilename);
      
      // Vérifier si le fichier existe
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new NotFoundException('Fichier Excel des formations non trouvé. Veuillez d\'abord télécharger le fichier.');
      }

      // Lire le fichier Excel
      const excelData = await fs.readFile(filePath);
      
      // Utiliser SheetJS pour lire le contenu
      const workbook = XLSX.read(excelData, {
        type: 'buffer',
        cellDates: true,
        cellNF: true,
        cellText: false
      });
      
      // Lire la première feuille
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir la feuille en JSON
      const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { 
        raw: true, 
        defval: null,
        header: 'A'
      });
      
      if (!data || data.length === 0) {
        throw new BadRequestException('Le fichier Excel ne contient pas de données valides');
      }

      // Analyser les en-têtes pour comprendre la structure du fichier
      const headers = data[0] as ExcelRow;
      this.logger.log(`En-têtes détectés: ${JSON.stringify(headers)}`);

      // Identifier les colonnes d'intérêt
      const columnMapping = this.identifyColumns(headers);
      this.logger.log(`Mapping des colonnes: ${JSON.stringify(columnMapping)}`);

      // Retirer la ligne d'en-tête
      const rowsData = data.slice(1) as ExcelRow[];

      // Convertir les données au format attendu
      const formattedData: FormattedFormation[] = rowsData
        .filter(row => {
          // Vérifier que la ligne contient des données pertinentes
          const titreValue = columnMapping.titre ? row[columnMapping.titre] : null;
          return titreValue !== null && titreValue !== undefined && titreValue !== '';
        })
        .map((row, index) => {
          // Extraire les valeurs des colonnes en utilisant le mapping
          const titre = columnMapping.titre ? (row[columnMapping.titre]?.toString() || 'Formation sans titre') : 'Formation sans titre';
          
          // Dates par défaut au cas où
          let dateDebut = new Date();
          let dateFin = new Date();
          dateFin.setDate(dateDebut.getDate() + 1);
          
          // Traiter les dates
          if (columnMapping.dateDebut) {
            const rawDateDebut = row[columnMapping.dateDebut];
            const parsedDateDebut = this.parseDate(rawDateDebut);
            if (parsedDateDebut) {
              dateDebut = parsedDateDebut;
            } else {
              this.logger.warn(`Date de début non valide pour la formation "${titre}", utilisation de la date actuelle.`);
            }
          }
          
          if (columnMapping.dateFin) {
            const rawDateFin = row[columnMapping.dateFin];
            const parsedDateFin = this.parseDate(rawDateFin);
            if (parsedDateFin) {
              dateFin = parsedDateFin;
            } else {
              this.logger.warn(`Date de fin non valide pour la formation "${titre}", utilisation de la date de début + 1 jour.`);
              dateFin = new Date(dateDebut);
              dateFin.setDate(dateFin.getDate() + 1);
            }
          }
          
          // Extraire le type de formation
          const type = this.extractType(titre);
          
          return {
            id: `formation-${index}`,
            titre: titre,
            type: type,
            dateDebut: dateDebut,
            dateFin: dateFin,
            description: columnMapping.description ? (row[columnMapping.description]?.toString() || null) : null,
            duree: columnMapping.duree ? (row[columnMapping.duree]?.toString() || 'Non spécifié') : 'Non spécifié',
            prix: columnMapping.prix ? row[columnMapping.prix] || 'Sur demande' : 'Sur demande',
            statut: "PLANIFIEE" // Valeur par défaut
          };
        });
      
      return formattedData;
    } catch (error) {
      this.logger.error(`Erreur lors du parsing du fichier Excel: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Identifier les colonnes correspondant à nos besoins
  private identifyColumns(headers: ExcelRow): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    // Parcourir les en-têtes pour identifier les colonnes
    for (const [key, value] of Object.entries(headers)) {
      if (!value) continue;
      
      const headerStr = String(value).toLowerCase();
      
      if (headerStr.includes('formation') || headerStr === 'titre' || headerStr === 'intitulé') {
        mapping.titre = key;
      } else if (headerStr.includes('date de début') || headerStr.includes('début') || headerStr === 'date') {
        mapping.dateDebut = key;
      } else if (headerStr.includes('date de fin') || headerStr.includes('fin')) {
        mapping.dateFin = key;
      } else if (headerStr.includes('description') || headerStr === 'contenu') {
        mapping.description = key;
      } else if (headerStr.includes('tarif') || headerStr.includes('prix') || headerStr === 'coût' || headerStr === 'montant') {
        mapping.prix = key;
      } else if (headerStr.includes('durée') || headerStr.includes('horaires') || headerStr === 'heure') {
        mapping.duree = key;
      }
    }
    
    // Si des colonnes essentielles sont manquantes, utiliser des heuristiques pour les deviner
    if (!mapping.titre) {
      // Essayer de trouver la première colonne qui pourrait contenir des titres
      for (const [key, value] of Object.entries(headers)) {
        if (value && typeof value === 'string' && value.length > 0) {
          mapping.titre = key;
          break;
        }
      }
    }
    
    return mapping;
  }

  // Fonction pour parser des dates sous différents formats
  private parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    
    // Si c'est déjà une date, la retourner
    if (dateValue instanceof Date) {
      return new Date(dateValue);
    }
    
    // Si c'est un nombre (Excel stocke les dates comme des nombres)
    if (typeof dateValue === 'number') {
      // Convertir le nombre Excel en date JavaScript
      // Excel commence le 1er janvier 1900
      const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const dateObj = new Date(excelEpoch.getTime() + (dateValue * millisecondsPerDay));
      return dateObj;
    }
    
    // Si c'est une chaîne, essayer de la parser
    if (typeof dateValue === 'string') {
      // Formats français courants: DD/MM/YYYY, DD-MM-YYYY, etc.
      const dateStr = dateValue.trim();
      
      // Format DD/MM/YYYY ou DD-MM-YYYY
      const frenchDateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
      const frenchMatch = dateStr.match(frenchDateRegex);
      
      if (frenchMatch) {
        const day = parseInt(frenchMatch[1], 10);
        const month = parseInt(frenchMatch[2], 10) - 1; // Les mois JavaScript commencent à 0
        let year = parseInt(frenchMatch[3], 10);
        
        // Ajuster l'année si elle est au format YY
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        return new Date(year, month, day);
      }
      
      // Essayer le format standard ISO
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
    }
    
    // Si aucune méthode ne fonctionne, renvoyer null
    return null;
  }
}