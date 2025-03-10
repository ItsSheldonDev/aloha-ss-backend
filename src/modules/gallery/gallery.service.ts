// src/gallery/gallery.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Image, Category } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);
  private readonly uploadDirectory = path.join(process.cwd(), 'public/uploads/galerie');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly compressionQuality = 80; // Qualité de compression (1-100)
  private readonly maxWidth = 1920; // Largeur maximale pour les images

  constructor(private readonly prisma: PrismaService) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDirectory, { recursive: true });
    } catch (error) {
      this.logger.error(`Erreur lors de la création du répertoire : ${error.message}`);
    }
  }

  async create(createImageDto: CreateImageDto, file: Express.Multer.File): Promise<Image> {
    try {
      if (!file) {
        throw new BadRequestException('Fichier image requis');
      }

      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('Buffer du fichier image vide');
      }

      this.logger.log(`Fichier reçu : ${file.originalname}, taille=${file.size} bytes, mimetype=${file.mimetype}`);

      // Vérifier la taille du fichier
      if (file.size > this.maxFileSize) {
        throw new BadRequestException(`Fichier trop volumineux (max: ${this.maxFileSize / (1024 * 1024)}MB)`);
      }

      // Vérifier le type MIME
      if (!this.allowedMimetypes.includes(file.mimetype)) {
        throw new BadRequestException(`Type de fichier non autorisé. Types acceptés: ${this.allowedMimetypes.join(', ')}`);
      }

      // Créer un nom de fichier sécurisé
      const filename = `${Date.now()}-${this.sanitizeFilename(file.originalname)}`;
      const filepath = path.join(this.uploadDirectory, filename);

      // Compresser et redimensionner l'image avant de l'enregistrer
      await this.compressAndSaveImage(file.buffer, filepath);

      // Créer l'entrée dans la base de données
      const image = await this.prisma.image.create({
        data: {
          filename,
          alt: createImageDto.alt,
          category: createImageDto.category,
        },
      });

      this.logger.log(`Image créée avec succès : ${filename}`);
      return image;
    } catch (error) {
      this.logger.error(`Erreur lors de la création de l'image : ${error.message}`, error.stack);
      throw error;
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
  }

  private async compressAndSaveImage(buffer: Buffer, filepath: string): Promise<void> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new BadRequestException('Buffer d\'image vide ou invalide');
      }

      this.logger.log(`Traitement de l'image : taille=${buffer.length} bytes`);

      // Utiliser sharp pour redimensionner et compresser
      const image = sharp(buffer);
      const metadata = await image.metadata();

      this.logger.log(`Métadonnées de l'image : format=${metadata.format}, width=${metadata.width}, height=${metadata.height}`);

      // Redimensionner seulement si l'image est plus large que maxWidth
      let processedImage = image;
      if (metadata.width && metadata.width > this.maxWidth) {
        processedImage = image.resize(this.maxWidth);
      }

      // Déterminer le format de sortie et la compression
      const format = metadata.format;
      switch (format) {
        case 'jpeg':
        case 'jpg':
          await processedImage.jpeg({ quality: this.compressionQuality }).toFile(filepath);
          break;
        case 'png':
          await processedImage.png({ quality: this.compressionQuality }).toFile(filepath);
          break;
        case 'webp':
          await processedImage.webp({ quality: this.compressionQuality }).toFile(filepath);
          break;
        default:
          this.logger.warn(`Format non supporté (${format}), conversion en webp`);
          await processedImage.webp({ quality: this.compressionQuality }).toFile(filepath);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la compression de l'image : ${error.message}`, error.stack);
      throw new BadRequestException(`Erreur lors de la compression de l'image : ${error.message}`);
    }
  }

  async findAll(category?: Category, mode?: string): Promise<any> {
    try {
      // Mode "all" - renvoyer les images groupées par catégorie
      if (mode === 'all') {
        const categories = Object.values(Category);
        const imagesByCategory = await Promise.all(
          categories.map(async (cat) => {
            const categoryImages = await this.prisma.image.findMany({
              where: { category: cat },
              select: {
                id: true,
                filename: true,
                alt: true,
                category: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            });

            return {
              category: cat,
              images: categoryImages.map(img => ({
                ...img,
                url: `/uploads/galerie/${img.filename}`,
              })),
            };
          })
        );
        return imagesByCategory;
      }

      // Mode "random" - renvoyer des images aléatoires
      if (mode === 'random') {
        const randomImages = await this.prisma.$queryRaw<Image[]>`
          SELECT id, filename, alt, category, "createdAt" 
          FROM "Image" 
          ORDER BY RANDOM() 
          LIMIT 4
        `;

        return randomImages.map(img => ({
          ...img,
          url: `/uploads/galerie/${img.filename}`,
        }));
      }

      // Mode par défaut - filtrage par catégorie
      const whereClause = category ? { category } : {};
      const images = await this.prisma.image.findMany({
        select: {
          id: true,
          filename: true,
          alt: true,
          category: true,
          createdAt: true,
        },
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      return images.map(image => ({
        ...image,
        url: `/uploads/galerie/${image.filename}`,
      }));
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des images : ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Image> {
    try {
      const image = await this.prisma.image.findUnique({
        where: { id },
      });

      if (!image) {
        throw new NotFoundException(`Image avec l'ID ${id} non trouvée`);
      }

      return image;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de l'image : ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
    try {
      await this.findOne(id);

      return await this.prisma.image.update({
        where: { id },
        data: updateImageDto,
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour de l'image : ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const image = await this.findOne(id);

      const filepath = path.join(this.uploadDirectory, image.filename);
      try {
        await fs.unlink(filepath);
      } catch (error) {
        this.logger.warn(`Fichier non trouvé lors de la suppression : ${error.message}`);
      }

      await this.prisma.image.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de l'image : ${error.message}`, error.stack);
      throw error;
    }
  }
}