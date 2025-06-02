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
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Excluir el archivo principal del servidor
    '!src/vercel.js', // Excluir configuración de Vercel
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  
  // Timeout para tests
  testTimeout: 30000,
  
  // Variables de entorno para tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
