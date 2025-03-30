const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const routeRoutes = require('./route.routes');
const placeRoutes = require('./place.routes');
const photoRoutes = require('./photo.routes');
const recommendationRoutes = require('./recommendation.routes');

/**
 * Registro de todas las rutas de la API
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones
 */
async function routes(fastify, options) {
  // Definir ruta base para comprobar que el API está funcionando
  fastify.get('/', {
    schema: {
      description: 'Ruta base para comprobar si la API está funcionando',
      tags: ['system'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return {
      status: 'ok',
      message: 'API de Nómada funcionando correctamente'
    };
  });

  // Rutas de autenticación
  fastify.register(authRoutes, { prefix: '/auth' });

  // Rutas de usuarios
  fastify.register(userRoutes, { prefix: '/users' });

  // Rutas para itinerarios/rutas de viaje
  fastify.register(routeRoutes, { prefix: '/routes' });

  // Rutas para lugares dentro de rutas de viaje
  fastify.register(placeRoutes, { prefix: '/places' });

  // Rutas para gestión de fotos
  fastify.register(photoRoutes, { prefix: '/photos' });

  // Rutas para recomendaciones
  fastify.register(recommendationRoutes, { prefix: '/recommendations' });
}

module.exports = routes; 