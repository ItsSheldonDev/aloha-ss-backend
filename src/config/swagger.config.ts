// src/config/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  // Configuration Swagger améliorée
  const config = new DocumentBuilder()
    .setTitle('API Aloha Secourisme')
    .setVersion('1.0.0')
    .setContact('Aloha Secourisme', 'https://www.aloha-secourisme.fr', 'contact@aloha-secourisme.fr')
    .setLicense('Propriétaire', 'https://www.aloha-secourisme.fr')
    .addServer('http://localhost:4000', 'Serveur local')
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
      defaultModelsExpandDepth: 1, // Réduire la profondeur des modèles par défaut
      defaultModelExpandDepth: 1,  // Réduire la profondeur du modèle par défaut
      tryItOutEnabled: true,       // Activer "Try it out" par défaut
      withCredentials: true,       // Envoyer les cookies avec les requêtes
    },
    customSiteTitle: 'API Aloha Secourisme - Documentation',
    customCss: '.swagger-ui .topbar { display: none }', // Masquer la barre supérieure
    explorer: true, // Activer l'explorateur pour une meilleure navigation
    swaggerUrl: '/docs-json',
  };
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Modifier les définitions de sécurité dans le document Swagger
  document.components = {
    ...document.components,
    securitySchemes: {
      'JWT-auth': {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Entrez votre token JWT ici',
      }
    }
  };
  
  // Appliquer la sécurité à tous les endpoints qui ont la directive ApiBearerAuth
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const operation = document.paths[path][method];
      // Si l'opération a la sécurité définie
      if (operation.security && operation.security.some(s => s['bearer'])) {
        // Remplacer par notre schéma de sécurité
        operation.security = [{ 'JWT-auth': [] }];
      }
    }
  }
  
  SwaggerModule.setup('docs', app, document, customOptions);

  // Logs informatifs
  Logger.log(`Swagger documentation available at http://localhost:${process.env.PORT || 3000}/docs`);
  Logger.log(`Number of documented endpoints: ${Object.keys(document.paths).length}`);
}