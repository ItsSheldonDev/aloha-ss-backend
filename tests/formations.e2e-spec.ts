// tests/formations.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Formations Module (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtToken: string;
  let formationId: string;

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
    
    // Créer un utilisateur de test pour l'authentification
    await createTestUser();
    
    // Obtenir un token JWT pour les tests
    jwtToken = await getJwtToken();
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
    // Supprimer les données de test
    if (formationId) {
      await prismaService.formation.delete({
        where: { id: formationId }
      }).catch(() => {
        // Ignorer les erreurs si la formation a déjà été supprimée
      });
    }
    
    await prismaService.admin.deleteMany({
      where: {
        email: 'test-admin@example.com'
      }
    });
    
    await app.close();
  });

  // Créer un utilisateur de test pour l'authentification
  async function createTestUser() {
    // Supprimer l'utilisateur de test s'il existe déjà
    await prismaService.admin.deleteMany({
      where: {
        email: 'test-admin@example.com'
      }
    });

    // Hasher le mot de passe pour les tests
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Créer un admin
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

  // Obtenir un token JWT pour les tests
  async function getJwtToken() {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-admin@example.com',
        password: 'password123'
      });
    
    return response.body.data.access_token;
  }

  it('devrait créer une nouvelle formation', async () => {
    const formationData = {
      titre: 'Formation PSC1 Test',
      type: 'PSC1',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours dans le futur
      duree: '7h',
      placesTotal: 10,
      prix: 59.99,
      lieu: 'Paris',
      formateur: 'Jean Formateur'
    };

    const response = await request(app.getHttpServer())
      .post('/api/formations/admin')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(formationData)
      .expect(201);

    formationId = response.body.data.id;
    expect(response.body.data).toMatchObject({
      titre: formationData.titre,
      type: formationData.type,
      placesDisponibles: formationData.placesTotal,
      prix: formationData.prix,
      lieu: formationData.lieu,
      formateur: formationData.formateur
    });
  });

  it('devrait récupérer toutes les formations (admin)', async () => {
    return request(app.getHttpServer())
      .get('/api/formations/admin')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });

  it('devrait récupérer toutes les formations publiques (public)', async () => {
    return request(app.getHttpServer())
      .get('/api/formations')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('devrait récupérer une formation par son ID', async () => {
    return request(app.getHttpServer())
      .get(`/api/formations/admin/${formationId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data.id).toBe(formationId);
      });
  });

  it('devrait mettre à jour une formation', async () => {
    const updateData = {
      titre: 'Formation PSC1 Test Mise à jour',
      prix: 69.99
    };

    return request(app.getHttpServer())
      .put(`/api/formations/admin/${formationId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateData)
      .expect(200)
      .expect(res => {
        expect(res.body.data.titre).toBe(updateData.titre);
        expect(res.body.data.prix).toBe(updateData.prix);
      });
  });

  it('devrait mettre à jour le statut d\'une formation', async () => {
    const updateStatusData = {
      statut: 'EN_COURS'
    };

    return request(app.getHttpServer())
      .put(`/api/formations/admin/${formationId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateStatusData)
      .expect(200)
      .expect(res => {
        expect(res.body.data.statut).toBe(updateStatusData.statut);
      });
  });
});