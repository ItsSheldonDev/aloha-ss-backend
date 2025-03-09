// tests/dashboard.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Dashboard Module (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtToken: string;

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
    
    // Créer des données de test pour les statistiques
    await createTestData();
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
    // Supprimer les données de test
    await cleanupTestData();
    
    // Supprimer l'utilisateur de test
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

  // Créer des données de test pour les statistiques
  async function createTestData() {
    // Créer quelques formations
    const formation1 = await prismaService.formation.create({
      data: {
        titre: 'Formation Test 1',
        type: 'PSC1',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours dans le futur
        duree: '7h',
        placesTotal: 10,
        placesDisponibles: 5,
        prix: 70,
        lieu: 'Paris',
        formateur: 'Formateur Test',
        statut: 'PLANIFIEE'
      }
    });

    const formation2 = await prismaService.formation.create({
      data: {
        titre: 'Formation Test 2',
        type: 'SST',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours dans le futur
        duree: '14h',
        placesTotal: 12,
        placesDisponibles: 8,
        prix: 120,
        lieu: 'Lyon',
        formateur: 'Formateur Test',
        statut: 'PLANIFIEE'
      }
    });

    // Créer quelques inscriptions
    await prismaService.inscription.createMany({
      data: [
        {
          nom: 'Nom Test 1',
          prenom: 'Prénom Test 1',
          email: 'test1@example.com',
          telephone: '0102030405',
          dateNaissance: new Date('1990-01-01'),
          statut: 'ACCEPTEE',
          formationId: formation1.id
        },
        {
          nom: 'Nom Test 2',
          prenom: 'Prénom Test 2',
          email: 'test2@example.com',
          telephone: '0607080910',
          dateNaissance: new Date('1985-05-15'),
          statut: 'EN_ATTENTE',
          formationId: formation1.id
        },
        {
          nom: 'Nom Test 3',
          prenom: 'Prénom Test 3',
          email: 'test3@example.com',
          telephone: '0102030405',
          dateNaissance: new Date('1995-10-20'),
          statut: 'ACCEPTEE',
          formationId: formation2.id
        }
      ]
    });
  }

  // Nettoyer les données de test
  async function cleanupTestData() {
    // Supprimer les inscriptions
    await prismaService.inscription.deleteMany({
      where: {
        email: {
          in: ['test1@example.com', 'test2@example.com', 'test3@example.com']
        }
      }
    });

    // Supprimer les formations
    await prismaService.formation.deleteMany({
      where: {
        titre: {
          in: ['Formation Test 1', 'Formation Test 2']
        }
      }
    });
  }

  it('devrait récupérer les statistiques pour le tableau de bord', async () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveProperty('overview');
        expect(res.body.data).toHaveProperty('comparison');
        expect(res.body.data).toHaveProperty('recentActivity');
        expect(res.body.data).toHaveProperty('charts');
        
        // Vérifier certaines données spécifiques
        expect(res.body.data.overview.totalFormations).toBeGreaterThanOrEqual(2);
        expect(res.body.data.overview.totalInscriptions).toBeGreaterThanOrEqual(3);
      });
  });

  it('devrait récupérer les statistiques annuelles', async () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard/yearly-stats')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });

  it('devrait récupérer les tendances d\'inscription', async () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard/inscription-trends')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveProperty('inscriptionsByType');
        expect(res.body.data).toHaveProperty('monthlyTrendsByType');
      });
  });

  it('devrait refuser l\'accès aux statistiques sans authentification', async () => {
    return request(app.getHttpServer())
      .get('/api/admin/dashboard/stats')
      .expect(401);
  });
});