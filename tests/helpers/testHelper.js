const createApp = require('../../src/app');

/**
 * Helper para crear una instancia de la aplicación para tests
 */
class TestHelper {
  constructor() {
    this.app = null;
  }

  /**
   * Inicializa la aplicación para tests
   */
  async setup() {
    this.app = await createApp();
    await this.app.ready();
    return this.app;
  }

  /**
   * Cierra la aplicación después de los tests
   */
  async teardown() {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * Obtiene la instancia de la aplicación
   */
  getApp() {
    return this.app;
  }

  /**
   * Mock de servicios para tests
   */
  mockServices() {
    // Mock de Supabase
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          })),
          in: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn()
          })),
          range: jest.fn()
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn()
        })),
        delete: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    };

    return {
      mockSupabase
    };
  }

  /**
   * Helper para generar datos de test
   */
  generateTestData() {
    return {
      user: {
        id: 'test-user-123',
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User'
      },
      route: {
        id: 'test-route-123',
        title: 'Test Route',
        description: 'A test route for testing',
        is_public: true,
        user_id: 'test-user-123',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        location: 'Test Location'
      },
      place: {
        id: 'test-place-123',
        name: 'Test Place',
        description: 'A test place',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        route_id: 'test-route-123'
      }
    };
  }
}

module.exports = TestHelper;
