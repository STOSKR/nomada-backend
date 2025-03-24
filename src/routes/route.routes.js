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
  listRoutes: {
    description: 'Listar rutas de viaje del usuario',
    tags: ['rutas'],
    security: [{ apiKey: [] }],
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 10 },
        offset: { type: 'integer', default: 0 },
        status: { type: 'string', enum: ['planned', 'in-progress', 'completed'] }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                status: { type: 'string', enum: ['planned', 'in-progress', 'completed'] },
                destinations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          count: { type: 'integer' }
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
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['planned', 'in-progress', 'completed'] },
              destinations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    order: { type: 'integer' },
                    placeId: { type: 'string' },
                    placeName: { type: 'string' },
                    stayDuration: { type: 'integer' },
                    arrivalDate: { type: 'string', format: 'date' },
                    departureDate: { type: 'string', format: 'date' },
                    activities: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          date: { type: 'string', format: 'date' },
                          location: { type: 'string' },
                          type: { type: 'string' },
                          isCompleted: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              totalDistance: { type: 'number' },
              budget: {
                type: 'object',
                properties: {
                  transportation: { type: 'number' },
                  accommodation: { type: 'number' },
                  activities: { type: 'number' },
                  food: { type: 'number' },
                  other: { type: 'number' },
                  total: { type: 'number' }
                }
              }
            }
          }
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
      required: ['name', 'destinations'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        status: { type: 'string', enum: ['planned', 'in-progress', 'completed'], default: 'planned' },
        destinations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['placeId', 'order'],
            properties: {
              placeId: { type: 'string' },
              order: { type: 'integer' },
              stayDuration: { type: 'integer' },
              arrivalDate: { type: 'string', format: 'date' },
              departureDate: { type: 'string', format: 'date' }
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
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
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
        name: { type: 'string' },
        description: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        status: { type: 'string', enum: ['planned', 'in-progress', 'completed'] },
        destinations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              placeId: { type: 'string' },
              order: { type: 'integer' },
              stayDuration: { type: 'integer' },
              arrivalDate: { type: 'string', format: 'date' },
              departureDate: { type: 'string', format: 'date' }
            }
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
  
  // Esquema para optimizar una ruta
  optimizeRoute: {
    description: 'Optimizar el orden de los destinos en una ruta para minimizar distancias',
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
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              originalDistance: { type: 'number' },
              optimizedDistance: { type: 'number' },
              destinations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    order: { type: 'integer' },
                    placeId: { type: 'string' },
                    placeName: { type: 'string' }
                  }
                }
              }
            }
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
  
  // Listar rutas del usuario
  fastify.get('/', {
    schema: schemas.listRoutes,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { limit, offset, status } = request.query;
      
      const result = await routeService.listRoutes(userId, { limit, offset, status });
      return {
        success: true,
        data: result.routes,
        count: result.count
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
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
      
      const route = await routeService.getRouteById(routeId, userId);
      
      if (!route) {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }
      
      return {
        success: true,
        data: route
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(error.statusCode || 500).send({
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
      
      const result = await routeService.createRoute(userId, routeData);
      
      return reply.code(201).send({
        success: true,
        message: 'Ruta creada correctamente',
        data: {
          id: result.id,
          name: result.name
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
      
      await routeService.updateRoute(routeId, userId, routeData);
      
      return {
        success: true,
        message: 'Ruta actualizada correctamente'
      };
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Route not found') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }
      
      if (error.message === 'Unauthorized access') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permiso para modificar esta ruta'
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
      
      if (error.message === 'Route not found') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }
      
      if (error.message === 'Unauthorized access') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permiso para eliminar esta ruta'
        });
      }
      
      return reply.code(500).send({
        success: false,
        message: 'Error al eliminar la ruta'
      });
    }
  });

  // Optimizar una ruta
  fastify.post('/:id/optimize', {
    schema: schemas.optimizeRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const routeId = request.params.id;
      
      const result = await routeService.optimizeRoute(routeId, userId);
      
      return {
        success: true,
        message: 'Ruta optimizada correctamente',
        data: result
      };
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Route not found') {
        return reply.code(404).send({
          success: false,
          message: 'Ruta no encontrada'
        });
      }
      
      if (error.message === 'Unauthorized access') {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permiso para optimizar esta ruta'
        });
      }
      
      return reply.code(500).send({
        success: false,
        message: 'Error al optimizar la ruta'
      });
    }
  });
}

module.exports = routeRoutes; 