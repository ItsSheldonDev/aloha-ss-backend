// tests/database.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Database Module (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let superAdminJwtToken: string;
  let adminJwtToken: string;

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
    superAdminJwtToken = await getSuperAdminJwtToken();
    adminJwtToken = await getAdminJwtToken();
    
    // Créer des données de test pour les opérations de base de données
    await createTestData();
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
    // Supprimer les données de test
    await cleanupTestData();
    
    // Supprimer les utilisateurs de test
    await prismaService.admin.deleteMany({
      where: {
        email: {
          in: ['test-superadmin@example.com', 'test-admin@example.com']
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
          in: ['test-superadmin@example.com', 'test-admin@example.com']
        }
      }
    });

    // Hasher le mot de passe pour les tests
    const hashedPassword = await bcrypt.hash('password123', 10);

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
  
  // Obtenir un token JWT pour l'admin normal
  async function getAdminJwtToken() {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-admin@example.com',
        password: 'password123'
      });
    
    return response.body.data.access_token;
  }

  // Créer des données de test
  async function createTestData() {
    // Créer une formation de test
    await prismaService.formation.create({
      data: {
        titre: 'Formation Database Test',
        type: 'PSC1',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        duree: '7h',
        placesTotal: 10,
        placesDisponibles: 10,
        prix: 99.99,
        lieu: 'Paris',
        formateur: 'Formateur Test',
        statut: 'PLANIFIEE'
      }
    });
    
    // Créer un paramètre de test
    await prismaService.setting.upsert({
      where: { key: 'test.setting' },
      update: { value: 'test value' },
      create: {
        key: 'test.setting',
        value: 'test value'
      }
    });
  }

  // Nettoyer les données de test
  async function cleanupTestData() {
    // Supprimer les formations de test
    await prismaService.formation.deleteMany({
      where: {
        titre: 'Formation Database Test'
      }
    });
    
    // Supprimer les paramètres de test
    await prismaService.setting.deleteMany({
      where: {
        key: 'test.setting'
      }
    });
  }

  it('devrait récupérer les statistiques de la base de données (super admin uniquement)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/database/stats')
      .set('Authorization', `Bearer ${superAdminJwtToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('admins');
    expect(response.body.data).toHaveProperty('formations');
    expect(response.body.data).toHaveProperty('inscriptions');
    expect(response.body.data).toHaveProperty('documents');
    expect(response.body.data).toHaveProperty('images');
    expect(response.body.data).toHaveProperty('news');
    
    // Vérifier que les statistiques incluent nos données de test
    expect(response.body.data.admins).toBeGreaterThanOrEqual(2); // Nos 2 utilisateurs de test
    expect(response.body.data.formations).toBeGreaterThanOrEqual(1); // Notre formation de test
  });

  it('devrait exporter la base de données (super admin uniquement)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/database/export')
      .set('Authorization', `Bearer ${superAdminJwtToken}`);
    
    // Permet les deux codes de statut : 200 OK ou 201 Created
    expect([200, 201]).toContain(response.status);
    
    // Vérifier le contenu de la réponse
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('admins');
    expect(response.body.data).toHaveProperty('formations');
    expect(response.body.data).toHaveProperty('settings');
    expect(response.body).toHaveProperty('metadata');
  });

  it('devrait refuser l\'accès aux statistiques pour les utilisateurs non super admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/database/stats')
      .set('Authorization', `Bearer ${adminJwtToken}`);
    
    expect(response.status).toBe(403);
  });

  it('devrait refuser l\'export de la base de données pour les utilisateurs non super admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/database/export')
      .set('Authorization', `Bearer ${adminJwtToken}`);
    
    expect(response.status).toBe(403);
  });
});