import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import * as fs from 'fs-extra';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  // Création des dossiers pour les uploads si nécessaire
  const uploadDirectories = [
    'public/uploads/documents',
    'public/uploads/galerie',
    'public/uploads/avatars',
    'public/uploads/excel',
  ];

  for (const dir of uploadDirectories) {
    const fullPath = join(process.cwd(), dir);
    await fs.ensureDir(fullPath);
    Logger.log(`Répertoire créé ou vérifié : ${fullPath}`);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Utiliser Winston comme logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Préfixe global pour les routes API
  app.setGlobalPrefix('api');

  // Validation automatique des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formattedErrors = errors.reduce((acc, err) => {
          acc[err.property] = Object.values(err.constraints || {}).join(', ');
          return acc;
        }, {});
        return new BadRequestException({
          message: 'Erreur de validation',
          errors: formattedErrors,
        });
      },
    }),
  );

  // Gestion des exceptions globales
  app.useGlobalFilters(new AllExceptionsFilter());

  // Transformation des réponses
  app.useGlobalInterceptors(new TransformInterceptor());

  // Configuration CORS dynamique
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://aloha-secourisme.fr', // Domaine de production
        'http://localhost:3000', // Pour tester directement le conteneur
        'http://localhost:5173', // Port par défaut de Vite/SvelteKit en dev
        'http://localhost:4000', // Si tu as un autre front-end en dev
      ];

      // Autoriser les requêtes sans origine (par exemple, requêtes directes via curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Authorization,Content-Type,Accept',
    credentials: true, // Autoriser les cookies/authentification
    maxAge: 86400, // Cache les pré-vérifications CORS pendant 24 heures
  });

  // Servir les fichiers statiques avec un préfixe explicite
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/uploads/', // Aligner avec le chemin stocké dans la base de données
  });
  Logger.log(`Fichiers statiques servis depuis ${join(process.cwd(), 'public')} avec préfixe /uploads/`);

  // Configuration Swagger
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Logs de démarrage améliorés
  Logger.log(`Application running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);

  // Message de démarrage personnalisé
  console.log('\n');
  console.log('='.repeat(50));
  console.log(`🚀 Aloha Secourisme API démarrée sur le port ${port}`);
  console.log(`🔗 Documentation Swagger: http://localhost:${port}/docs`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('\n');
}

bootstrap();