/**
 * Rutas de itinerarios/rutas de viaje
 * 
 * Maneja la creación, actualización, búsqueda y optimización de rutas de viaje
 */
const RouteService = require('../services/route.service');

/**
 * Esquemas para validación y documentación
 */
const schemas = {
  // Esquema para listar rutas
  getRoutes: {
    description: 'Listar rutas de viaje (con filtros)',
    tags: ['rutas'],
    security: [{ apiKey: [] }],
    querystring: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        featured: { type: 'boolean' },
        country: { type: 'string' },
        tag: { type: 'string' },
        limit: { type: 'integer', default: 20 },
        offset: { type: 'integer', default: 0 }
      }
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            country: { type: 'string' },
            likes_count: { type: 'integer' },
            is_public: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                full_name: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },

  // Esquema para obtener una ruta específica
  getRoute: {
    description: 'Obtener detalles de una ruta de viaje',
    tags: ['rutas'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          country: { type: 'string' },
          likes_count: { type: 'integer' },
          is_public: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              full_name: { type: 'string' }
            }
          },
          places: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                coordinates: { type: 'string' },
                order_index: { type: 'integer' },
                photos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      public_url: { type: 'string' },
                      caption: { type: 'string' },
                      order_index: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          isLiked: { type: 'boolean' }
        }
      }
    }
  },

  // Esquema para crear una ruta
  createRoute: {
    description: 'Crear una nueva ruta de viaje',
    tags: ['rutas'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        country: { type: 'string' },
        is_public: { type: 'boolean', default: true },
        cover_image: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        places: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              },
              order_index: { type: 'integer' }
            }
          }
        }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          route: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' }
            }
          }
        }
      }
    }
  },

  // Esquema para actualizar una ruta
  updateRoute: {
    description: 'Actualizar una ruta de viaje existente',
    tags: ['rutas'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        country: { type: 'string' },
        is_public: { type: 'boolean' },
        cover_image: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' }
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

  // Esquema para eliminar una ruta
  deleteRoute: {
    description: 'Eliminar una ruta de viaje',
    tags: ['rutas'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' }
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

  // Esquema para dar like a una ruta
  likeRoute: {
    description: 'Dar like a una ruta',
    tags: ['rutas', 'interacción'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' }
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

  // Esquema para quitar like de una ruta
  unlikeRoute: {
    description: 'Quitar like de una ruta',
    tags: ['rutas', 'interacción'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' }
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

  // Esquema para obtener likes de una ruta
  getRouteLikes: {
    description: 'Obtener usuarios que dieron like a una ruta',
    tags: ['rutas', 'interacción'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 20 },
        offset: { type: 'integer', default: 0 }
      }
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' }
          }
        }
      }
    }
  }
};

/**
 * Plugin de Fastify para las rutas de viaje
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function routeRoutes(fastify, options) {
  // Instancia del servicio de rutas
  const routeService = new RouteService(fastify.supabase);

  // Listar rutas (con filtros)
  fastify.get('/', {
    schema: schemas.getRoutes,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const filters = request.query;

      // Si se solicitan rutas del usuario actual, reemplazar 'me' por el ID real
      if (filters.userId === 'me') {
        filters.userId = request.user.id;
      }

      const routes = await routeService.getRoutes(filters);

      return routes;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener una ruta específica
  fastify.get('/:id', {
    schema: schemas.getRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeId = request.params.id;

      const route = await routeService.getRouteDetail(routeId, userId);

      return route;
    } catch (error) {
      request.log.error(error);

      if (error.message === 'Ruta no encontrada') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }

      if (error.message.includes('No tienes permiso')) {
        return reply.code(403).send({
          success: false,
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Crear una nueva ruta
  fastify.post('/', {
    schema: schemas.createRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeData = request.body;

      const route = await routeService.createRoute(routeData, userId);

      return reply.code(201).send({
        success: true,
        message: 'Ruta creada correctamente',
        route: {
          id: route.id,
          title: route.title
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Actualizar una ruta existente
  fastify.put('/:id', {
    schema: schemas.updateRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeId = request.params.id;
      const routeData = request.body;

      const updatedRoute = await routeService.updateRoute(routeId, routeData, userId);

      return {
        success: true,
        message: 'Ruta actualizada correctamente'
      };
    } catch (error) {
      request.log.error(error);

      if (error.message === 'Ruta no encontrada') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }

      if (error.message.includes('No tienes permiso')) {
        return reply.code(403).send({
          success: false,
          message: error.message
        });
      }

      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Eliminar una ruta
  fastify.delete('/:id', {
    schema: schemas.deleteRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeId = request.params.id;

      await routeService.deleteRoute(routeId, userId);

      return {
        success: true,
        message: 'Ruta eliminada correctamente'
      };
    } catch (error) {
      request.log.error(error);

      if (error.message === 'Ruta no encontrada') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }

      if (error.message.includes('No tienes permiso')) {
        return reply.code(403).send({
          success: false,
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Dar like a una ruta
  fastify.post('/:id/like', {
    schema: schemas.likeRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeId = request.params.id;

      const result = await routeService.likeRoute(routeId, userId);

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      request.log.error(error);

      if (error.message === 'Ruta no encontrada') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }

      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Quitar like de una ruta
  fastify.delete('/:id/like', {
    schema: schemas.unlikeRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeId = request.params.id;

      const result = await routeService.unlikeRoute(routeId, userId);

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener usuarios que dieron like a una ruta
  fastify.get('/:id/likes', {
    schema: schemas.getRouteLikes,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const routeId = request.params.id;
      const { limit = 20, offset = 0 } = request.query;

      const users = await routeService.getRouteLikes(routeId, limit, offset);

      return users;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });
}

module.exports = routeRoutes; 