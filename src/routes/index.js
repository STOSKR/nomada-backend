const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const routeRoutes = require('./route.routes');
const placeRoutes = require('./place.routes');
const photoRoutes = require('./photo.routes');
const recommendationRoutes = require('./recommendation.routes');
const ocrRoutes = require('./ocr.routes');

/**
 * Registro de todas las rutas de la API
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones
 */
async function routes(fastify, options) {

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

  // Rutas para OCR y procesamiento de imágenes
  fastify.register(ocrRoutes, { prefix: '/ocr' });
}

module.exports = routes; 