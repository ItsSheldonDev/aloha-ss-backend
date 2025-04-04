import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // Importer ConfigModule pour utiliser ConfigService
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpg|jpeg|png|webp/;
        const isValid = allowedTypes.test(file.mimetype);
        if (!isValid) {
          return callback(new Error(`Type de fichier non autorisé : ${file.mimetype}. Types acceptés : jpg, jpeg, png, webp`), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}