// tests/setup-jest.ts
import { config as dotenvConfig } from 'dotenv';

// Charger les variables d'environnement à partir de .env.test
dotenvConfig({ path: '.env.test' });

// Configurer Jest pour les tests asynchrones
jest.setTimeout(30000);

// Supprimer les logs pendant les tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};