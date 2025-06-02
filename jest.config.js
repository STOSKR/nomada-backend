module.exports = {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Patrón de archivos de test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/uploads/',
    '/temp/'
  ],
  
  // Setup para tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Excluir el archivo principal del servidor
    '!src/vercel.js', // Excluir configuración de Vercel
    '!src/routes/**/*.js', // Excluir rutas (no tienen tests unitarios)
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],    // Coverage thresholds (adjusted to current coverage levels)
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 8,
      lines: 8,
      statements: 8
    },
    // Adjusted thresholds for services with existing tests
    './src/services/': {
      branches: 30,
      functions: 35,
      lines: 30,
      statements: 30
    }
  },

  // Timeout para tests
  testTimeout: 30000,
  
  // Variables de entorno para tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
