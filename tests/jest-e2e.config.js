// tests/jest-e2e.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',  // Utilise ce modèle pour trouver les fichiers de test
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testTimeout: 30000, // 30 secondes
  // Exécuter les tests de façon séquentielle plutôt qu'en parallèle
  // pour éviter les conflits entre les tests
  maxWorkers: 1,
  // Ajouter cette option pour voir le détail des tests
  verbose: true,
  // Ne pas s'arrêter après le premier échec
  bail: false,
  // Configurer la gestion des erreurs asynchrones
  testRunner: 'jest-circus/runner',
};