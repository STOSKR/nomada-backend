/**
 * Rutas de usuarios
 * 
 * Maneja autenticación, registro, perfil y preferencias de usuario
 */
const UserService = require('../services/user.service');

/**
 * Esquemas para validación y documentación
 */
const schemas = {
  // Esquema para registro de usuario
  register: {
    description: 'Registrar un nuevo usuario',
    tags: ['usuarios'],
    body: {
      type: 'object',
      required: ['email', 'password', 'username'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        username: { type: 'string', minLength: 3 },
        fullName: { type: 'string' },
        bio: { type: 'string' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      }
    }
  },
  
  // Esquema para inicio de sesión
  login: {
    description: 'Iniciar sesión de usuario',
    tags: ['usuarios'],
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      }
    }
  },
  
  // Esquema para obtener perfil
  getProfile: {
    description: 'Obtener perfil del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              fullName: { type: 'string' },
              bio: { type: 'string' },
              preferences: {
                type: 'object',
                properties: {
                  favoriteDestinations: { type: 'array', items: { type: 'string' } },
                  travelStyle: { type: 'string', enum: ['adventure', 'relax', 'culture', 'gastronomy'] },
                  budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] }
                }
              },
              visitedCountries: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },
  
  // Esquema para actualizar preferencias
  updatePreferences: {
    description: 'Actualizar preferencias de viaje del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      properties: {
        preferences: {
          type: 'object',
          properties: {
            favoriteDestinations: { type: 'array', items: { type: 'string' } },
            travelStyle: { type: 'string', enum: ['adventure', 'relax', 'culture', 'gastronomy'] },
            budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] }
          }
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      }
    }
  },
  
  // Esquema para añadir país visitado
  addVisitedCountry: {
    description: 'Añadir país visitado al perfil del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      required: ['countryCode'],
      properties: {
        countryCode: { type: 'string', minLength: 2, maxLength: 2 },
        visitDate: { type: 'string', format: 'date' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          visitedCountries: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};

/**
 * Plugin de Fastify para las rutas de usuario
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function userRoutes(fastify, options) {
  // Instancia del servicio de usuarios
  const userService = new UserService(fastify.supabase);
  
  // Registro de usuario
  fastify.post('/register', { schema: schemas.register }, async (request, reply) => {
    try {
      const result = await userService.registerUser(request.body);
      return reply.code(201).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Inicio de sesión
  fastify.post('/login', { schema: schemas.login }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      const result = await userService.loginUser(email, password);
      
      // Generar token JWT
      const token = fastify.jwt.sign({
        id: result.user.id,
        email: result.user.email
      });
      
      return {
        success: true,
        token,
        user: result.user
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(401).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener perfil (autenticado)
  fastify.get('/profile', {
    schema: schemas.getProfile,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const result = await userService.getUserProfile(userId);
      return {
        success: true,
        user: result
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(404).send({
        success: false,
        message: error.message
      });
    }
  });

  // Actualizar preferencias (autenticado)
  fastify.put('/preferences', {
    schema: schemas.updatePreferences,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { preferences } = request.body;
      await userService.updatePreferences(userId, preferences);
      return {
        success: true,
        message: 'Preferencias actualizadas correctamente'
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Añadir país visitado (autenticado)
  fastify.post('/visited-countries', {
    schema: schemas.addVisitedCountry,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { countryCode, visitDate } = request.body;
      const result = await userService.addVisitedCountry(userId, countryCode, visitDate);
      return {
        success: true,
        message: 'País visitado añadido correctamente',
        visitedCountries: result.visitedCountries
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });
}

module.exports = userRoutes; 