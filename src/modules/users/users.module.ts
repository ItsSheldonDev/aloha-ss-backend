// src/users.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = './public/uploads/avatars';
          const logger = new Logger('MulterStorage');
          logger.log(`Destination définie : ${uploadPath}`);
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            logger.log(`Répertoire créé : ${uploadPath}`);
          }
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          const logger = new Logger('MulterStorage');
          logger.log(`Nom de fichier généré : ${filename}`);
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        const logger = new Logger('MulterFileFilter');
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          logger.warn(`Type de fichier non autorisé : ${file.mimetype}`);
          return callback(new Error('Seules les images sont autorisées'), false);
        }
        logger.log(`Type de fichier autorisé : ${file.mimetype}`);
        callback(null, true);
      },
      limits: {
        fileSize: 1 * 1024 * 1024, // 1 MB
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}