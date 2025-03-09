// tests/settings.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Settings Module (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminJwtToken: string;
  let superAdminJwtToken: string;

  // Configuration de l'application avant tous les tests
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
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
    
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.setGlobalPrefix('api');
    
    await app.init();

    // Obtenir le service Prisma pour les opérations de base de données
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Créer les utilisateurs de test
    await createTestUsers();
    
    // Obtenir les tokens JWT pour les tests
    adminJwtToken = await getAdminJwtToken();
    superAdminJwtToken = await getSuperAdminJwtToken();
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
    // Supprimer les paramètres de test
    await cleanupTestSettings();
    
    // Supprimer les utilisateurs de test
    await prismaService.admin.deleteMany({
      where: {
        email: {
          in: ['test-admin@example.com', 'test-superadmin@example.com']
        }
      }
    });
    
    await app.close();
  });

  // Créer les utilisateurs de test
  async function createTestUsers() {
    // Supprimer les utilisateurs de test s'ils existent déjà
    await prismaService.admin.deleteMany({
      where: {
        email: {
          in: ['test-admin@example.com', 'test-superadmin@example.com']
        }
      }
    });

    // Hasher le mot de passe pour les tests
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Créer un admin normal
    await prismaService.admin.create({
      data: {
        email: 'test-admin@example.com',
        password: hashedPassword,
        nom: 'Test',
        prenom: 'Admin',
        role: 'ADMIN'
      }
    });
    
    // Créer un super admin
    await prismaService.admin.create({
      data: {
        email: 'test-superadmin@example.com',
        password: hashedPassword,
        nom: 'Test',
        prenom: 'SuperAdmin',
        role: 'SUPER_ADMIN'
      }
    });
  }

  // Obtenir un token JWT pour l'admin
  async function getAdminJwtToken() {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-admin@example.com',
        password: 'password123'
      });
    
    return response.body.data.access_token;
  }
  
  // Obtenir un token JWT pour le super admin
  async function getSuperAdminJwtToken() {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-superadmin@example.com',
        password: 'password123'
      });
    
    return response.body.data.access_token;
  }

  // Nettoyer les paramètres de test
  async function cleanupTestSettings() {
    const testSettings = [
      'contact.email',
      'contact.phone',
      'contact.address',
      'social.facebook',
      'social.instagram',
      'notifications.emailInscription',
      'notifications.emailContact'
    ];
    
    for (const key of testSettings) {
      await prismaService.setting.deleteMany({
        where: { key }
      }).catch(err => {
        console.warn(`Erreur lors de la suppression du paramètre ${key}: ${err.message}`);
      });
    }
  }

  it('devrait récupérer les paramètres du système', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminJwtToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('contact');
    expect(response.body.data).toHaveProperty('social');
    expect(response.body.data).toHaveProperty('notifications');
  });

  it('devrait mettre à jour les paramètres (super admin uniquement)', async () => {
    const settingsData = {
      contact: {
        email: 'nouveau-contact@example.com',
        phone: '0789123456',
        address: 'Nouvelle adresse'
      },
      social: {
        facebook: 'https://facebook.com/updated',
        instagram: 'https://instagram.com/updated'
      },
      notifications: {
        emailInscription: true,
        emailContact: false
      }
    };

    const response = await request(app.getHttpServer())
      .post('/api/admin/settings')
      .set('Authorization', `Bearer ${superAdminJwtToken}`)
      .send(settingsData);
    
    // Permet les deux codes de statut : 200 OK ou 201 Created
    expect([200, 201]).toContain(response.status);
    
    // Vérifier que les paramètres ont été mis à jour
    expect(response.body.data.contact.email).toBe(settingsData.contact.email);
    expect(response.body.data.social.facebook).toBe(settingsData.social.facebook);
    expect(response.body.data.notifications.emailContact).toBe(settingsData.notifications.emailContact);
  });

  it('devrait refuser la mise à jour des paramètres par un admin normal', async () => {
    const settingsData = {
      contact: {
        email: 'contact-refuse@example.com'
      }
    };

    const response = await request(app.getHttpServer())
      .post('/api/admin/settings')
      .set('Authorization', `Bearer ${adminJwtToken}`)
      .send(settingsData);
    
    expect(response.status).toBe(403);
  });
});