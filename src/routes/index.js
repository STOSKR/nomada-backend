/**
 * Registro de rutas de la API
 * 
 * Este archivo centraliza todas las rutas de la API y las registra con Fastify
 */

// Importar los módulos de rutas
const userRoutes = require('./user.routes');
const routeRoutes = require('./route.routes');
const recommendationRoutes = require('./recommendation.routes');

/**
 * Plugin de Fastify para registrar todas las rutas de la API
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function routes(fastify, options) {
  // Rutas de usuario (autenticación, perfil, preferencias)
  fastify.register(userRoutes, { prefix: '/users' });
  
  // Rutas de itinerarios/rutas de viaje
  fastify.register(routeRoutes, { prefix: '/routes' });
  
  // Rutas de recomendaciones
  fastify.register(recommendationRoutes, { prefix: '/recommendations' });
  
  // Ruta genérica para la API
  fastify.get('/', {
    schema: {
      description: 'Información básica de la API',
      tags: ['info'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return {
      name: 'Nómada API',
      version: '1.0.0',
      description: 'API para la aplicación de viajeros Nómada'
    };
  });

  // Ruta para verificar el token JWT (útil para validar sesiones)
  fastify.get('/verify-token', {
    schema: {
      description: 'Verificar validez del token JWT',
      tags: ['auth'],
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            user: { 
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    return {
      valid: true,
      user: {
        id: request.user.id,
        email: request.user.email
      }
    };
  });
}

module.exports = routes; 