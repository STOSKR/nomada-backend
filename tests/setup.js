// Configuración global para los tests
require('dotenv').config({ path: '.env.test' });

// Mock de console para tests más limpios
global.console = {
  ...console,
  // Silenciar logs durante tests (descomenta si quieres ver logs)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Variables globales para tests
global.testUserId = 'test-user-id';
global.testRouteId = 'test-route-id';

// Configuración de timeout por defecto
jest.setTimeout(30000);

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
