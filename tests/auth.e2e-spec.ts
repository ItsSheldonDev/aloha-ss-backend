// tests/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth Module (e2e)', () => {
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
    
    // Créer des utilisateurs de test pour les tests d'authentification
    await createTestUsers();
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
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

  // Créer des utilisateurs de test pour l'authentification
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

    // Créer un admin standard
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

  it('devrait permettre l\'authentification avec des identifiants valides', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-admin@example.com',
        password: 'password123'
      })
      .expect(200);
    
    // Stocker le token pour les autres tests
    jwtToken = response.body.data.access_token;
    
    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('email', 'test-admin@example.com');
  });

  it('devrait refuser l\'authentification avec des identifiants invalides', async () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-admin@example.com',
        password: 'wrong-password'
      })
      .expect(401);
  });

  it('devrait récupérer le profil authentifié', async () => {
    return request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveProperty('email', 'test-admin@example.com');
        expect(res.body.data).toHaveProperty('role', 'ADMIN');
      });
  });

  it('devrait refuser l\'accès au profil sans authentification', async () => {
    return request(app.getHttpServer())
      .get('/api/auth/profile')
      .expect(401);
  });
});