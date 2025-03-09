// tests/health.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Health Module (e2e)', () => {
  let app: INestApplication;

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
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
    await app.close();
  });

  it('devrait vérifier l\'état de santé de l\'API', async () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveProperty('status');
        expect(res.body.data).toHaveProperty('timestamp');
        expect(res.body.data).toHaveProperty('uptime');
        expect(res.body.data).toHaveProperty('database');
        expect(res.body.data).toHaveProperty('responseTime');
        expect(res.body.data).toHaveProperty('environment');
        
        // Vérifier que le statut est OK
        expect(res.body.data.status).toBe('ok');
        // Vérifier que la base de données est connectée
        expect(res.body.data.database.status).toBe('ok');
      });
  });

  it('devrait être accessible sans authentification', async () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
  });
});