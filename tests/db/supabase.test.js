const { supabase, supabasePlugin } = require('../../src/db/supabase');

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}));

// Mock fastify-plugin
jest.mock('fastify-plugin', () => jest.fn(fn => fn));

describe('Supabase Database Connection', () => {
  let mockFastify;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Fastify instance
    mockFastify = {
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      decorate: jest.fn(),
      decorateRequest: jest.fn()
    };
    
    // Set environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
  });

  describe('Environment Variables', () => {
    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL;
      
      expect(() => {
        jest.resetModules();
        require('../../src/db/supabase');
      }).toThrow('Faltan variables de entorno para Supabase');
    });

    it('should throw error when SUPABASE_KEY is missing', () => {
      delete process.env.SUPABASE_KEY;
      
      expect(() => {
        jest.resetModules();
        require('../../src/db/supabase');
      }).toThrow('Faltan variables de entorno para Supabase');
    });

    it('should use SUPABASE_SERVICE_KEY over SUPABASE_KEY when available', () => {
      process.env.SUPABASE_SERVICE_KEY = 'service-key';
      
      const { createClient } = require('@supabase/supabase-js');
      jest.resetModules();
      require('../../src/db/supabase');
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'service-key',
        expect.any(Object)
      );
    });
  });

  describe('Supabase Client Configuration', () => {
    it('should create client with correct configuration', () => {
      const { createClient } = require('@supabase/supabase-js');
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
    });

    it('should export supabase client', () => {
      expect(supabase).toBeDefined();
      expect(typeof supabase).toBe('object');
    });
  });

  describe('Supabase Plugin', () => {
    it('should register plugin successfully with valid connection', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      };

      // Mock the supabase client to return successful connection
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      await supabasePlugin(mockFastify, {});

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        'Conexión con Supabase establecida correctamente'
      );
      expect(mockFastify.decorate).toHaveBeenCalledWith('supabase', expect.any(Object));
      expect(mockFastify.decorateRequest).toHaveBeenCalled();
    });

    it('should handle table not found error gracefully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { code: '42P01', message: 'relation "users" does not exist' } 
            }))
          }))
        }))
      };

      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      await supabasePlugin(mockFastify, {});

      expect(mockFastify.log.warn).toHaveBeenCalledWith(
        'Las tablas no existen en Supabase. Ejecuta: npm run seed'
      );
      expect(mockFastify.decorate).toHaveBeenCalled();
    });

    it('should handle other database errors', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { code: 'OTHER_ERROR', message: 'Some other error' } 
            }))
          }))
        }))
      };

      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      await supabasePlugin(mockFastify, {});

      expect(mockFastify.log.error).toHaveBeenCalledWith(
        'Error al conectar con Supabase:', 
        'Some other error'
      );
    });

    it('should handle connection exceptions', async () => {
      const mockSupabase = {
        from: jest.fn(() => {
          throw new Error('Connection failed');
        })
      };

      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      await supabasePlugin(mockFastify, {});

      expect(mockFastify.log.error).toHaveBeenCalledWith(
        'Error al conectar con Supabase:', 
        'Connection failed'
      );
    });

    it('should decorate fastify instance with supabase client', async () => {
      await supabasePlugin(mockFastify, {});

      expect(mockFastify.decorate).toHaveBeenCalledWith('supabase', expect.any(Object));
    });

    it('should decorate request with supabase getter', async () => {
      await supabasePlugin(mockFastify, {});

      expect(mockFastify.decorateRequest).toHaveBeenCalledWith('supabase', {
        getter: expect.any(Function)
      });

      // Test the getter function
      const decorateCall = mockFastify.decorateRequest.mock.calls[0];
      const getterFn = decorateCall[1].getter;
      expect(getterFn()).toBe(supabase);
    });
  });

  describe('Export Structure', () => {
    it('should export both supabase client and plugin', () => {
      const exports = require('../../src/db/supabase');
      
      expect(exports.supabase).toBeDefined();
      expect(exports.supabasePlugin).toBeDefined();
      expect(typeof exports.supabasePlugin).toBe('function');
    });
  });
});
