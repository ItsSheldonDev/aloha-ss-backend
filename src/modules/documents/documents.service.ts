// src/modules/documents/documents.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document, DocumentCategory } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadDirectory = path.join(process.cwd(), 'public/uploads/documents');

  constructor(private readonly prisma: PrismaService) {
    // Créer le répertoire d'upload si nécessaire
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDirectory, { recursive: true });
    } catch (error) {
      this.logger.error(`Erreur lors de la création du répertoire : ${error.message}`);
    }
  }

  async create(createDocumentDto: CreateDocumentDto, file: Express.Multer.File): Promise<Document> {
    try {
      if (!file) {
        throw new BadRequestException('Fichier requis');
      }

      // Vérifier la taille du fichier (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Fichier trop volumineux (max: 10MB)');
      }

      // Vérifier si le buffer est disponible
      if (!file.buffer) {
        throw new BadRequestException('Le fichier n\'a pas été correctement chargé en mémoire');
      }

      // Créer un nom de fichier sécurisé
      const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '-')}`;
      const filepath = path.join(this.uploadDirectory, filename);

      // Sauvegarder le fichier
      await fs.writeFile(filepath, file.buffer);

      // Créer l'entrée dans la base de données
      const document = await this.prisma.document.create({
        data: {
          title: createDocumentDto.title,
          category: createDocumentDto.category,
          filename,
          size: file.size,
          downloads: 0,
        },
      });

      return document;
    } catch (error) {
      this.logger.error(`Erreur lors de la création du document : ${error.message}`, error.stack);
      throw new BadRequestException(`Erreur lors de la création du document : ${error.message}`);
    }
  }

  async findAll(category?: DocumentCategory): Promise<Document[]> {
    try {
      const whereClause = category ? { category } : {};

      return await this.prisma.document.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des documents : ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Document> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);
      }

      return document;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du document : ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    try {
      // Vérifier si le document existe
      await this.findOne(id);

      // Mettre à jour le document
      return await this.prisma.document.update({
        where: { id },
        data: updateDocumentDto,
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du document : ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Récupérer le document pour avoir le nom du fichier
      const document = await this.findOne(id);

      // Supprimer le fichier
      const filepath = path.join(this.uploadDirectory, document.filename);
      try {
        await fs.unlink(filepath);
      } catch (error) {
        this.logger.warn(`Fichier non trouvé lors de la suppression : ${error.message}`);
        // Continuer même si le fichier n'existe pas
      }

      // Supprimer l'entrée de la base de données
      await this.prisma.document.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du document : ${error.message}`, error.stack);
      throw error;
    }
  }

  async incrementDownloadCount(id: string): Promise<number> {
    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: {
          downloads: {
            increment: 1,
          },
        },
        select: {
          downloads: true,
        },
      });

      return document.downloads;
    } catch (error) {
      this.logger.error(`Erreur lors de l'incrémentation du compteur de téléchargements : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDownloadCount(id: string): Promise<number> {
    try {
      const document = await this.findOne(id);
      return document.downloads;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du compteur de téléchargements : ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileForDownload(id: string): Promise<{ buffer: Buffer; mimetype: string; filename: string }> {
    try {
      const document = await this.findOne(id);

      // Incrémenter le compteur de téléchargements
      await this.incrementDownloadCount(id);

      // Lire le fichier
      const filepath = path.join(this.uploadDirectory, document.filename);
      const buffer = await fs.readFile(filepath);

      // Déterminer le type MIME
      const ext = path.extname(document.filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
      };

      const mimetype = mimeTypes[ext] || 'application/octet-stream';

      return { buffer, mimetype, filename: document.filename };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du fichier pour téléchargement : ${error.message}`, error.stack);
      throw error;
    }
  }
}