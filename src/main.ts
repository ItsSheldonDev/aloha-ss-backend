import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import * as fs from 'fs-extra';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  // Création des dossiers pour les uploads si nécessaire
  const uploadDirectories = [
    'public/uploads/documents',
    'public/uploads/galerie',
    'public/uploads/avatars',
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
  app.useGlobalPipes(new ValidationPipe({
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
  }));
  
  // Gestion des exceptions globales
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Transformation des réponses
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Configuration CORS détaillée
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:4000' // Pour le développement local
      : 'https://aloha-secourisme.fr', // Remplace par ton domaine en production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Authorization,Content-Type,Accept',
    credentials: true, // Autoriser les cookies/authentification si nécessaire
    maxAge: 86400, // Cache les pré-vérifications CORS pendant 24 heures
  });
  
  // Servir les fichiers statiques avec un préfixe explicite
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/uploads/', // Aligner avec le chemin stocké dans la base de données
  });
  Logger.log(`Fichiers statiques servis depuis ${join(process.cwd(), 'public')} avec préfixe /uploads/`);
  
  // Configuration Swagger améliorée
  const config = new DocumentBuilder()
    .setTitle('API Aloha Secourisme')
    .setDescription(`
      API REST complète pour la gestion de l'application Aloha Secourisme.
      
      Cette API permet de gérer les formations, les inscriptions, les documents, 
      la galerie d'images et l'administration du système.
      
      ## Authentification
      
      La plupart des endpoints nécessitent une authentification par token JWT.
      Pour vous authentifier, utilisez l'endpoint \`/api/auth/login\` pour obtenir un token,
      puis incluez ce token dans l'en-tête d'autorisation de vos requêtes.
      
      ## Rôles
      
      - **Accès public** : Accessible sans authentification
      - **Admin** : Nécessite d'être connecté avec un compte administrateur
      - **Super Admin** : Nécessite d'être connecté avec un compte super administrateur
      
      ## Modules principaux
      
      - **Formations** : Gestion des sessions de formation
      - **Inscriptions** : Gestion des inscriptions aux formations
      - **Documents** : Gestion des documents téléchargeables
      - **Galerie** : Gestion des images de la galerie
      - **News** : Gestion des actualités
      - **Admin/Users** : Gestion des utilisateurs administrateurs
      - **Dashboard** : Statistiques et tableaux de bord
      - **Settings** : Paramètres du système
      - **Database** : Export/import de la base de données
    `)
    .setVersion('1.0.0')
    .setContact('Aloha Secourisme', 'https://www.aloha-secourisme.fr', 'contact@aloha-secourisme.fr')
    .setLicense('Propriétaire', 'https://www.aloha-secourisme.fr')
    .addServer('http://localhost:3000', 'Serveur local')
    .addServer('https://api.aloha-secourisme.fr', 'Serveur de production')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        description: 'Entrez votre token JWT ici',
      },
      'JWT-auth', // Nom de cette sécurité pour référence
    )
    .build();
  
  // Options personnalisées pour l'interface Swagger UI
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true, // Conserver l'autorisation entre les rechargements
      tagsSorter: 'alpha', // Trier les tags par ordre alphabétique
      operationsSorter: 'alpha', // Trier les opérations par ordre alphabétique
      docExpansion: 'none', // Fermer tous les endpoints par défaut
    },
    customSiteTitle: 'API Aloha Secourisme - Documentation',
    customCss: '.swagger-ui .topbar { display: none }', // Masquer la barre supérieure
  };
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, customOptions);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Logs de démarrage améliorés
  Logger.log(`Application running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  Logger.log(`Swagger documentation available at http://localhost:${port}/docs`);
  Logger.log(`Number of documented endpoints: ${Object.keys(document.paths).length}`);
  
  // Créer un fichier JSON de la documentation pour référence en mode développement
  if (process.env.NODE_ENV === 'development') {
    fs.writeFileSync('swagger-spec.json', JSON.stringify(document, null, 2));
    Logger.log('Swagger documentation exported to swagger-spec.json');
  }
  
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