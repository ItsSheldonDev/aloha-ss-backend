import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: configService.get('NODE_ENV') === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Successfully connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Successfully disconnected from database');
  }

  async cleanDatabase() {
    if (this.configService.get('NODE_ENV') === 'test') {
      this.logger.warn('Cleaning test database...');
      // Logique de nettoyage pour les tests
      const modelNames = Reflect.ownKeys(this).filter(
        (key) => key[0] !== '_' && key[0] !== '$' && typeof this[key] === 'object',
      );
      
      return await Promise.all(
        modelNames.map((modelName) => this[modelName].deleteMany()),
      );
    }
  }
}