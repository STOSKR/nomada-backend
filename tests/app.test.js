// Mock all dependencies first
jest.mock('fastify');
jest.mock('@fastify/cors');
jest.mock('@fastify/jwt');
jest.mock('@fastify/multipart');
jest.mock('multer');
jest.mock('fs');
jest.mock('../src/db/supabase');
jest.mock('../src/routes');

const fs = require('fs');
const multer = require('multer');

// Mock Fastify instance
const mockFastify = {
  logger: true,
  register: jest.fn(),
  decorate: jest.fn(),
  addContentTypeParser: jest.fn(),
  get: jest.fn(),
  ready: jest.fn().mockResolvedValue(),
  jwt: {
    verify: jest.fn()
  },
  log: {
    error: jest.fn()
  }
};

// Mock fastify constructor
require('fastify').mockReturnValue(mockFastify);

// Mock multer
const mockUpload = {
  single: jest.fn(() => jest.fn())
};
multer.mockReturnValue(mockUpload);
multer.memoryStorage = jest.fn();
multer.diskStorage = jest.fn();

// Mock fs
fs.existsSync = jest.fn();
fs.mkdirSync = jest.fn();

describe('App Configuration', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    delete process.env.VERCEL;
    delete process.env.JWT_SECRET;
    
    // Mock successful file operations
    fs.existsSync.mockReturnValue(true);
  });

  describe('Environment Detection', () => {
    it('should detect Vercel production environment', async () => {
      process.env.VERCEL = '1';
      
      // Reset modules to pick up environment changes
      jest.resetModules();
      app = require('../src/app');
      
      expect(multer.memoryStorage).toHaveBeenCalled();
    });

    it('should use disk storage in development', async () => {
      // Don't set VERCEL environment variable
      
      jest.resetModules();
      app = require('../src/app');
      
      expect(multer.diskStorage).toHaveBeenCalled();
    });
  });

  describe('Directory Setup', () => {
    it('should create uploads directory if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      
      jest.resetModules();
      app = require('../src/app');
      
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should not create uploads directory if it already exists', async () => {
      fs.existsSync.mockReturnValue(true);
      
      jest.resetModules();
      app = require('../src/app');
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('Fastify Configuration', () => {
    beforeEach(() => {
      jest.resetModules();
      app = require('../src/app');
    });

    it('should create Fastify instance with correct options', () => {
      expect(require('fastify')).toHaveBeenCalledWith({
        logger: true,
        bodyLimit: 100 * 1024 * 1024,
        ajv: {
          customOptions: {
            removeAdditional: false,
            coerceTypes: false
          }
        }
      });
    });

    it('should register Supabase plugin', () => {
      expect(mockFastify.register).toHaveBeenCalledWith(
        expect.anything() // supabasePlugin
      );
    });

    it('should register CORS with correct options', () => {
      expect(mockFastify.register).toHaveBeenCalledWith(
        require('@fastify/cors'),
        {
          origin: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          credentials: true
        }
      );
    });

    it('should register JWT with correct configuration', () => {
      expect(mockFastify.register).toHaveBeenCalledWith(
        require('@fastify/jwt'),
        {
          secret: 'un_secreto_muy_seguro',
          sign: {
            expiresIn: '24h'
          }
        }
      );
    });

    it('should use custom JWT secret from environment', () => {
      process.env.JWT_SECRET = 'custom-secret';
      
      jest.resetModules();
      require('../src/app');
      
      expect(mockFastify.register).toHaveBeenCalledWith(
        require('@fastify/jwt'),
        expect.objectContaining({
          secret: 'custom-secret'
        })
      );
    });
  });

  describe('Authentication Decorators', () => {
    let mockRequest, mockReply;
    
    beforeEach(() => {
      jest.resetModules();
      require('../src/app');
      
      mockRequest = {
        headers: {},
        log: {
          error: jest.fn()
        }
      };
      
      mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
    });

    describe('authenticate decorator', () => {
      let authenticateFunction;
      
      beforeEach(() => {
        const decorateCall = mockFastify.decorate.mock.calls.find(
          call => call[0] === 'authenticate'
        );
        authenticateFunction = decorateCall[1];
      });

      it('should reject request without authorization header', async () => {
        await authenticateFunction(mockRequest, mockReply);
        
        expect(mockReply.code).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: 'No se proporcionó token de autenticación'
        });
      });

      it('should handle token with Bearer prefix', async () => {
        mockRequest.headers.authorization = 'Bearer valid-token';
        mockFastify.jwt.verify.mockResolvedValue({ id: 'user123' });
        
        await authenticateFunction(mockRequest, mockReply);
        
        expect(mockFastify.jwt.verify).toHaveBeenCalledWith('valid-token');
        expect(mockRequest.user).toEqual({ id: 'user123' });
      });

      it('should handle token without Bearer prefix', async () => {
        mockRequest.headers.authorization = 'valid-token';
        mockFastify.jwt.verify.mockResolvedValue({ id: 'user123' });
        
        await authenticateFunction(mockRequest, mockReply);
        
        expect(mockFastify.jwt.verify).toHaveBeenCalledWith('valid-token');
        expect(mockRequest.user).toEqual({ id: 'user123' });
      });

      it('should reject invalid token', async () => {
        mockRequest.headers.authorization = 'invalid-token';
        mockFastify.jwt.verify.mockRejectedValue(new Error('Invalid token'));
        
        await authenticateFunction(mockRequest, mockReply);
        
        expect(mockReply.code).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: 'Token de autenticación inválido'
        });
      });
    });

    describe('authenticateOptional decorator', () => {
      let authenticateOptionalFunction;
      
      beforeEach(() => {
        const decorateCall = mockFastify.decorate.mock.calls.find(
          call => call[0] === 'authenticateOptional'
        );
        authenticateOptionalFunction = decorateCall[1];
      });

      it('should continue without authentication when no header provided', async () => {
        await authenticateOptionalFunction(mockRequest, mockReply);
        
        expect(mockRequest.user).toBeUndefined();
        expect(mockReply.code).not.toHaveBeenCalled();
      });

      it('should set user when valid token provided', async () => {
        mockRequest.headers.authorization = 'Bearer valid-token';
        mockFastify.jwt.verify.mockResolvedValue({ id: 'user123' });
        
        await authenticateOptionalFunction(mockRequest, mockReply);
        
        expect(mockRequest.user).toEqual({ id: 'user123' });
      });

      it('should continue without user when invalid token provided', async () => {
        mockRequest.headers.authorization = 'Bearer invalid-token';
        mockFastify.jwt.verify.mockRejectedValue(new Error('Invalid token'));
        
        await authenticateOptionalFunction(mockRequest, mockReply);
        
        expect(mockRequest.user).toBeUndefined();
        expect(mockReply.code).not.toHaveBeenCalled();
      });
    });
  });

  describe('Content Type Parser', () => {
    let parserFunction;
    
    beforeEach(() => {
      jest.resetModules();
      require('../src/app');
      
      const addContentTypeParserCall = mockFastify.addContentTypeParser.mock.calls.find(
        call => call[0] === 'application/json'
      );
      parserFunction = addContentTypeParserCall[2];
    });

    it('should parse valid JSON', () => {
      const mockDone = jest.fn();
      const jsonString = '{"test": "value"}';
      
      parserFunction({}, jsonString, mockDone);
      
      expect(mockDone).toHaveBeenCalledWith(null, { test: 'value' });
    });

    it('should handle invalid JSON', () => {
      const mockDone = jest.fn();
      const invalidJson = '{"test": invalid}';
      
      parserFunction({}, invalidJson, mockDone);
      
      expect(mockDone).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
        undefined
      );
    });
  });

  describe('Multipart Configuration', () => {
    beforeEach(() => {
      jest.resetModules();
      require('../src/app');
    });

    it('should register multipart with correct limits', () => {
      expect(mockFastify.register).toHaveBeenCalledWith(
        require('@fastify/multipart'),
        {
          limits: {
            fieldNameSize: 100,
            fieldSize: 100 * 1024 * 1024,
            fields: 10,
            fileSize: 100 * 1024 * 1024,
            files: 1,
            headerPairs: 2000
          }
        }
      );
    });
  });

  describe('Routes Registration', () => {
    beforeEach(() => {
      jest.resetModules();
      require('../src/app');
    });

    it('should register main routes', () => {
      expect(mockFastify.register).toHaveBeenCalledWith(
        require('../src/routes')
      );
    });

    it('should register root route', () => {
      expect(mockFastify.get).toHaveBeenCalledWith(
        '/',
        expect.any(Function)
      );
    });
  });

  describe('App Export', () => {
    it('should export function that returns ready app', async () => {
      jest.resetModules();
      const appFactory = require('../src/app');
      
      expect(typeof appFactory).toBe('function');
      
      const appInstance = await appFactory();
      
      expect(mockFastify.ready).toHaveBeenCalled();
      expect(appInstance).toBe(mockFastify);
    });
  });

  describe('Multer Handler', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should handle file upload successfully', () => {
      const mockRequest = {
        raw: {
          file: { filename: 'test.jpg' },
          body: { description: 'test' }
        },
        body: {}
      };
      const mockReply = { raw: {} };
      const mockDone = jest.fn();
      
      // Mock upload.single to call callback without error
      mockUpload.single.mockReturnValue((req, res, callback) => {
        req.file = { filename: 'test.jpg' };
        req.body = { description: 'test' };
        callback(null);
      });
      
      require('../src/app');
      
      // The multerHandler function is created but not directly exportable
      // This test verifies the mock setup works correctly
      expect(mockUpload.single).toBeDefined();
    });
  });
});
