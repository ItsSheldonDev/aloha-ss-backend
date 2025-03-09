// tests/news.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('News Module (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtToken: string;
  let newsId: string;

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
    // Supprimer l'actualité de test
    if (newsId) {
      await prismaService.news.delete({
        where: { id: newsId }
      }).catch(() => {
        // Ignorer les erreurs si l'actualité a déjà été supprimée
      });
    }
    
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

  it('devrait créer une nouvelle actualité', async () => {
    const newsData = {
      title: 'Actualité test',
      content: 'Contenu de l\'actualité test',
      author: 'Jean Testeur',
      published: true
    };

    const response = await request(app.getHttpServer())
      .post('/api/news/admin')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(newsData)
      .expect(201);

    newsId = response.body.data.id;
    expect(response.body.data).toMatchObject({
      title: newsData.title,
      content: newsData.content,
      author: newsData.author,
      published: newsData.published
    });
  });

  it('devrait récupérer toutes les actualités (admin)', async () => {
    return request(app.getHttpServer())
      .get('/api/news/admin')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data.news).toBeDefined();
        expect(Array.isArray(res.body.data.news)).toBe(true);
        expect(res.body.data.news.length).toBeGreaterThan(0);
      });
  });

  it('devrait récupérer toutes les actualités publiées (public)', async () => {
    return request(app.getHttpServer())
      .get('/api/news')
      .expect(200)
      .expect(res => {
        expect(res.body.data.news).toBeDefined();
        expect(Array.isArray(res.body.data.news)).toBe(true);
        expect(res.body.data).toHaveProperty('pagination');
      });
  });

  it('devrait récupérer une actualité par son ID', async () => {
    return request(app.getHttpServer())
      .get(`/api/news/admin/${newsId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data.id).toBe(newsId);
      });
  });

  it('devrait mettre à jour une actualité', async () => {
    const updateData = {
      title: 'Actualité test mise à jour',
      content: 'Contenu mis à jour',
      published: false
    };

    return request(app.getHttpServer())
      .put(`/api/news/admin/${newsId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateData)
      .expect(200)
      .expect(res => {
        expect(res.body.data.title).toBe(updateData.title);
        expect(res.body.data.content).toBe(updateData.content);
        expect(res.body.data.published).toBe(updateData.published);
      });
  });

  it('devrait vérifier que les actualités non publiées ne sont pas accessibles au public', async () => {
    // L'actualité a été définie comme non publiée dans le test précédent
    return request(app.getHttpServer())
      .get('/api/news')
      .expect(200)
      .expect(res => {
        const foundNews = res.body.data.news.find(n => n.id === newsId);
        expect(foundNews).toBeUndefined();
      });
  });
});