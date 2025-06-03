const {
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError
} = require('../../src/utils/errors.js');

describe('Error Classes', () => {
  describe('HttpError', () => {
    it('should create HttpError with default status code 500', () => {
      const error = new HttpError('Something went wrong');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('HttpError');
      expect(error.stack).toBeDefined();
    });

    it('should create HttpError with custom status code', () => {
      const error = new HttpError('Custom error', 418);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(418);
      expect(error.name).toBe('HttpError');
    });

    it('should capture stack trace', () => {
      const error = new HttpError('Test error');
      expect(error.stack).toContain('HttpError: Test error');
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default message and 404 status', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Recurso no encontrado');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with default message and 401 status', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('No autorizado');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Invalid credentials');
      
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with default message and 403 status', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Acceso prohibido');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');
      
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('BadRequestError', () => {
    it('should create BadRequestError with default message and 400 status', () => {
      const error = new BadRequestError();
      
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Solicitud incorrecta');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
    });

    it('should create BadRequestError with custom message', () => {
      const error = new BadRequestError('Missing required field');
      
      expect(error.message).toBe('Missing required field');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with default message and 409 status', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Conflicto con el estado actual');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create ServiceUnavailableError with default message and 503 status', () => {
      const error = new ServiceUnavailableError();
      
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(ServiceUnavailableError);
      expect(error.message).toBe('Servicio no disponible');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('ServiceUnavailableError');
    });

    it('should create ServiceUnavailableError with custom message', () => {
      const error = new ServiceUnavailableError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(503);
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper inheritance chain', () => {
      const errors = [
        new NotFoundError(),
        new UnauthorizedError(),
        new ForbiddenError(),
        new BadRequestError(),
        new ConflictError(),
        new ServiceUnavailableError()
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBeGreaterThan(0);
        expect(error.message).toBeTruthy();
        expect(error.name).toBeTruthy();
        expect(error.stack).toBeDefined();
      });
    });
  });

  describe('Error handling in catch blocks', () => {
    it('should work properly when thrown and caught', () => {
      try {
        throw new NotFoundError('Test resource not found');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error).toBeInstanceOf(HttpError);
        expect(error.message).toBe('Test resource not found');
        expect(error.statusCode).toBe(404);
      }
    });

    it('should preserve stack trace when thrown', () => {
      try {
        function throwError() {
          throw new BadRequestError('Invalid input');
        }
        throwError();
      } catch (error) {
        expect(error.stack).toContain('throwError');
        expect(error.stack).toContain('BadRequestError: Invalid input');
      }
    });
  });
});
