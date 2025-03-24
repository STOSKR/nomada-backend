/**
 * Errores personalizados para la API
 * 
 * Facilita el manejo de errores HTTP con mensajes y códigos adecuados
 */

/**
 * Error HTTP personalizado con código de estado
 * @extends Error
 */
class HttpError extends Error {
  /**
   * Crea una nueva instancia de HttpError
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código de estado HTTP
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error para recursos no encontrados (404)
 * @extends HttpError
 */
class NotFoundError extends HttpError {
  /**
   * Crea una nueva instancia de NotFoundError
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * Error para solicitudes no autorizadas (401)
 * @extends HttpError
 */
class UnauthorizedError extends HttpError {
  /**
   * Crea una nueva instancia de UnauthorizedError
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

/**
 * Error para acceso prohibido (403)
 * @extends HttpError
 */
class ForbiddenError extends HttpError {
  /**
   * Crea una nueva instancia de ForbiddenError
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'Acceso prohibido') {
    super(message, 403);
  }
}

/**
 * Error para solicitudes incorrectas (400)
 * @extends HttpError
 */
class BadRequestError extends HttpError {
  /**
   * Crea una nueva instancia de BadRequestError
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'Solicitud incorrecta') {
    super(message, 400);
  }
}

/**
 * Error para conflictos (409)
 * @extends HttpError
 */
class ConflictError extends HttpError {
  /**
   * Crea una nueva instancia de ConflictError
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'Conflicto con el estado actual') {
    super(message, 409);
  }
}

/**
 * Error para servicios no disponibles (503)
 * @extends HttpError
 */
class ServiceUnavailableError extends HttpError {
  /**
   * Crea una nueva instancia de ServiceUnavailableError
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'Servicio no disponible') {
    super(message, 503);
  }
}

module.exports = {
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError
}; 