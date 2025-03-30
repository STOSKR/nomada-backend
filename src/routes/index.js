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

}

module.exports = routes; 