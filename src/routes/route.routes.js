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
            is_public: { type: 'boolean' },
            likes_count: { type: 'integer' },
            saved_count: { type: 'integer' },
            comments_count: { type: 'integer' },
            cover_image: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                full_name: { type: 'string' },
                avatar_url: { type: 'string' }
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
          is_public: { type: 'boolean' },
          likes_count: { type: 'integer' },
          saved_count: { type: 'integer' },
          comments_count: { type: 'integer' },
          cover_image: { type: 'string' },
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
                address: { type: 'string' },
                coordinates: { type: 'string' },
                rating: { type: 'number' },
                formatted_schedule: { type: 'string' },
                order_in_day: { type: 'integer' },
                day_number: { type: 'integer' },
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
      properties: {
        is_public: { type: 'boolean', default: true },
        cover_image: { type: 'string' },
        places: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              address: { type: 'string' },
              rating: { type: 'number' },
              schedule: {
                type: 'object',
                properties: {
                  monday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  },
                  tuesday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  },
                  wednesday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  },
                  thursday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  },
                  friday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  },
                  saturday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  },
                  sunday: {
                    type: 'object',
                    properties: {
                      open: { type: 'string' },
                      close: { type: 'string' }
                    }
                  }
                }
              },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              },
              day_number: { type: 'integer' },
              order_in_day: { type: 'integer' }
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
              id: { type: 'string' }
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
        is_public: { type: 'boolean' },
        cover_image: { type: 'string' }
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
  },

  // Esquema para optimizar rutas de viaje
  optimizeRoute: {
    description: 'Optimizar el orden de visita de lugares en una ruta',
    tags: ['rutas', 'optimización'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      required: ['places'],
      properties: {
        places: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'coordinates'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              coordinates: {
                type: 'object',
                required: ['lat', 'lng'],
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              },
              visitDuration: { type: 'number', description: 'Duración estimada de la visita en horas' },
              openingHours: {
                type: 'object',
                properties: {
                  open: { type: 'string', description: 'Hora de apertura en formato HH:MM' },
                  close: { type: 'string', description: 'Hora de cierre en formato HH:MM' }
                }
              },
              isEssential: { type: 'boolean', description: 'Indica si es imprescindible visitar este lugar', default: false }
            }
          }
        },
        startPoint: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        hotel: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            coordinates: {
              type: 'object',
              required: ['lat', 'lng'],
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              }
            }
          },
          description: 'Hotel o alojamiento que será punto de partida y retorno cada día'
        },
        days: { type: 'integer', description: 'Número de días para distribuir la ruta', minimum: 1 },
        maxHoursPerDay: { type: 'number', description: 'Horas máximas de actividad por día', default: 8 }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          optimizedRoute: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' }
                  }
                },
                order_index: { type: 'integer' },
                day: { type: 'integer' },
                visitDuration: { type: 'number' }
              }
            }
          }
        }
      }
    }
  },

  // Esquema para obtener lugares de una ruta
  getPlaces: {
    description: 'Obtener todos los lugares de una ruta específica',
    tags: ['rutas', 'lugares'],
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
          routeId: { type: 'string' },
          places: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                address: { type: 'string' },
                coordinates: { type: 'string' },
                rating: { type: 'number' },
                formatted_schedule: { type: 'string' },
                schedule: { type: 'object' },
                order_in_day: { type: 'integer' },
                day_number: { type: 'integer' },
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
    preValidation: [fastify.authenticateOptional]
  }, async function (request, reply) {
    try {
      const filters = request.query;
      // Si hay usuario autenticado, se obtiene su ID
      if (request.user) {
        filters.userId = filters.userId || request.user.id;
      }

      const routeService = new RouteService(this.supabase);
      const routes = await routeService.getRoutes(filters);

      return reply.code(200).send(routes);
    } catch (error) {
      request.log.error('Error al listar rutas:', error);

      return reply.code(500).send({
        success: false,
        message: 'Error al obtener las rutas: ' + error.message
      });
    }
  });

  // Obtener una ruta específica
  fastify.get('/:id', {
    schema: schemas.getRoute,
    // Quitamos la preValidation o usamos la que exista
    // Si se necesita autenticación opcional, podemos adaptar el código
    // para manejar usuarios no autenticados
  }, async function (request, reply) {
    try {
      const routeId = request.params.id;
      // El usuario puede estar autenticado o no
      const userId = request.user?.id || null;

      const routeService = new RouteService(this.supabase);
      const route = await routeService.getRouteById(routeId, userId);

      return reply.code(200).send(route);
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
        message: 'Error al obtener la ruta: ' + error.message
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

      const routeData = {
        ...request.body,
        places: request.body.places || []
      };

      const routeService = new RouteService(fastify.supabase);
      const route = await routeService.createRoute(routeData, userId);

      return reply.code(201).send({
        success: true,
        message: 'Ruta creada correctamente',
        routeId: route.id
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
  }, async function (request, reply) {
    try {
      const routeId = request.params.id;
      const userId = request.user.id;
      const routeData = request.body;

      const routeService = new RouteService(this.supabase);
      const result = await routeService.updateRoute(routeId, routeData, userId);

      return reply.code(200).send(result);
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
        message: 'Error al actualizar la ruta: ' + error.message
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

  // Optimizar ruta (orden de visita de lugares)
  fastify.post('/optimizar', {
    schema: schemas.optimizeRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { places, startPoint, hotel, days = 1, maxHoursPerDay = 8 } = request.body;

      // Validaciones más estrictas de los datos de entrada
      if (!places || !Array.isArray(places) || places.length < 2) {
        return reply.code(400).send({
          success: false,
          message: 'Se requieren al menos 2 lugares válidos para optimizar una ruta'
        });
      }

      // Verificar que los lugares tienen coordenadas válidas
      const placesWithCoordinates = places.filter(place => {
        return place && place.coordinates &&
          typeof place.coordinates === 'object' &&
          typeof place.coordinates.lat === 'number' &&
          typeof place.coordinates.lng === 'number';
      });

      if (placesWithCoordinates.length < 2) {
        return reply.code(400).send({
          success: false,
          message: 'Se requieren al menos 2 lugares con coordenadas válidas'
        });
      }

      // Log para depuración con más detalles sobre los datos recibidos
      console.log('Optimizando ruta:');
      console.log(`- ${placesWithCoordinates.length} lugares válidos`);
      console.log(`- ${days} días`);
      console.log(`- Punto de inicio: ${startPoint ? 'Sí' : 'No'}`);
      console.log(`- Hotel: ${hotel ? hotel.name || 'Sin nombre' : 'No'}`);

      try {
        // Calcular distancias entre todos los puntos
        const distances = calculateDistanceMatrix(placesWithCoordinates, startPoint, hotel);
        console.log('Matriz de distancias calculada correctamente');

        // Aplicar algoritmo del vecino más cercano para encontrar la ruta óptima
        let optimizedRoute;

        if (days > 1) {
          console.log('Usando optimización para múltiples días');
          // Si se especifican días, usar la versión del algoritmo con distribución por días
          optimizedRoute = findOptimalRouteWithDays(placesWithCoordinates, distances, startPoint, hotel, days, maxHoursPerDay);
        } else {
          console.log('Usando optimización para un solo día');
          // Usar el algoritmo original para un solo día
          optimizedRoute = findOptimalRoute(placesWithCoordinates, distances, startPoint, hotel);
        }

        // Verificar que la ruta optimizada existe y tiene elementos
        if (!optimizedRoute || !Array.isArray(optimizedRoute) || optimizedRoute.length === 0) {
          console.error('No se pudo generar una ruta optimizada');
          return reply.code(500).send({
            success: false,
            message: 'Error al optimizar la ruta: no se pudo generar una ruta optimizada'
          });
        }

        // Asegurarse de que todas las propiedades necesarias estén presentes
        optimizedRoute = optimizedRoute.map((place, index) => {
          // Verificar si faltan las propiedades requeridas
          if (typeof place.day === 'undefined') {
            place.day = Math.min(Math.floor(index / Math.ceil(optimizedRoute.length / days)) + 1, days);
          }
          if (typeof place.order_in_day === 'undefined') {
            // Calcular orden dentro del día
            const placesInSameDay = optimizedRoute.filter(p => p.day === place.day);
            const sameDay = placesInSameDay.findIndex(p => p.order_index === place.order_index);
            place.order_in_day = sameDay >= 0 ? sameDay : index % Math.ceil(optimizedRoute.length / days);
          }
          return place;
        });

        console.log(`Ruta optimizada generada con ${optimizedRoute.length} lugares`);

        // Verificar rápidamente que tenemos toda la información necesaria
        const hasMissingInfo = optimizedRoute.some(place =>
          typeof place.day === 'undefined' ||
          typeof place.order_in_day === 'undefined' ||
          typeof place.order_index === 'undefined'
        );

        if (hasMissingInfo) {
          console.warn('Algunos lugares no tienen toda la información necesaria');
        }

        return {
          success: true,
          optimizedRoute
        };
      } catch (error) {
        console.error('Error durante el proceso de optimización:', error);

        // Si hay un error durante la optimización, responder con un array ordenado simple
        const simpleOptimizedRoute = placesWithCoordinates.map((place, index) => {
          const day = Math.min(Math.floor(index / Math.ceil(placesWithCoordinates.length / days)) + 1, days);
          const placesPerDay = Math.ceil(placesWithCoordinates.length / days);
          const order_in_day = index % placesPerDay;

          return {
            ...place,
            order_index: index,
            day: day,
            order_in_day: order_in_day
          };
        });

        console.log('Devolviendo una ruta simple sin optimizar debido al error');
        return {
          success: true,
          optimizedRoute: simpleOptimizedRoute,
          warning: 'No se pudo optimizar completamente la ruta debido a un error interno'
        };
      }
    } catch (error) {
      console.error('Error general en endpoint de optimización:', error);
      return reply.code(500).send({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  });

  // Obtener lugares de una ruta
  fastify.get('/:id/places', {
    schema: schemas.getPlaces,
    preValidation: [fastify.authenticateOptional]
  }, async (request, reply) => {
    try {
      const routeId = request.params.id;
      const userId = request.user ? request.user.id : null;

      const routeService = new RouteService(fastify.supabase);
      const places = await routeService.getPlacesFromRoute(routeId, userId);

      return reply.send(places);
    } catch (error) {
      request.log.error('Error al obtener lugares:', error);
      return reply.code(error.message.includes('No tienes permiso') ? 403 : 400).send({
        success: false,
        message: error.message
      });
    }
  });
}

/**
 * Calcula la matriz de distancias entre todos los puntos
 * @param {Array} places - Array de lugares con coordenadas
 * @param {Object} startPoint - Punto de inicio opcional
 * @param {Object} hotel - Hotel como punto de partida/regreso opcional
 * @returns {Array} Matriz de distancias
 */
function calculateDistanceMatrix(places, startPoint = null, hotel = null) {
  console.log(`Calculando matriz de distancias para ${places.length} lugares`);

  // Verificar que todos los lugares tengan coordenadas válidas
  const validPlaces = places.filter(place => {
    if (!place.coordinates || typeof place.coordinates !== 'object') {
      console.error(`Lugar sin coordenadas válidas:`, place);
      return false;
    }
    if (typeof place.coordinates.lat !== 'number' || typeof place.coordinates.lng !== 'number') {
      console.error(`Coordenadas inválidas en lugar:`, place.coordinates);
      return false;
    }
    return true;
  });

  console.log(`Lugares válidos con coordenadas: ${validPlaces.length} de ${places.length}`);

  // Si no hay lugares válidos, retornar una matriz vacía
  if (validPlaces.length === 0) {
    console.error("No hay lugares con coordenadas válidas para calcular distancias");
    return [[]];
  }

  // Si hay hotel, lo usamos como punto de inicio en lugar del startPoint
  let actualStartPoint = null;

  if (hotel && hotel.coordinates &&
    typeof hotel.coordinates === 'object' &&
    typeof hotel.coordinates.lat === 'number' &&
    typeof hotel.coordinates.lng === 'number') {
    actualStartPoint = hotel.coordinates;
    console.log(`Usando hotel como punto de inicio: ${actualStartPoint.lat}, ${actualStartPoint.lng}`);
  } else if (startPoint &&
    typeof startPoint === 'object' &&
    typeof startPoint.lat === 'number' &&
    typeof startPoint.lng === 'number') {
    actualStartPoint = startPoint;
    console.log(`Usando startPoint como punto de inicio: ${actualStartPoint.lat}, ${actualStartPoint.lng}`);
  }

  // Crear la lista completa de puntos
  const points = [];

  // Añadir el punto de inicio si existe
  if (actualStartPoint) {
    points.push(actualStartPoint);
  }

  // Añadir todos los lugares válidos
  validPlaces.forEach(place => {
    points.push(place.coordinates);
  });

  console.log(`Total de puntos para matriz de distancias: ${points.length}`);

  // Calcular la matriz de distancias
  const n = points.length;
  const distances = Array(n).fill().map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        try {
          distances[i][j] = calculateDistance(points[i], points[j]);
        } catch (error) {
          console.error(`Error al calcular distancia entre puntos ${i} y ${j}:`, error);
          distances[i][j] = 999999; // Valor alto para evitar esta ruta
        }
      }
    }
  }

  console.log(`Matriz de distancias calculada: ${n}x${n}`);
  return distances;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Object} point1 - Primer punto {lat, lng}
 * @param {Object} point2 - Segundo punto {lat, lng}
 * @returns {number} Distancia en kilómetros
 */
function calculateDistance(point1, point2) {
  // Verificar que los puntos son válidos
  if (!point1 || !point2 ||
    typeof point1.lat !== 'number' || typeof point1.lng !== 'number' ||
    typeof point2.lat !== 'number' || typeof point2.lng !== 'number') {
    console.error('Puntos inválidos para cálculo de distancia:', { point1, point2 });
    return 999999; // Valor alto para puntos inválidos
  }

  // Convertir coordenadas a números por seguridad
  const lat1 = Number(point1.lat);
  const lng1 = Number(point1.lng);
  const lat2 = Number(point2.lat);
  const lng2 = Number(point2.lng);

  // Verificar que las coordenadas son números válidos
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    console.error('Coordenadas no numéricas:', { lat1, lng1, lat2, lng2 });
    return 999999;
  }

  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convierte grados a radianes
 * @param {number} value - Valor en grados
 * @returns {number} Valor en radianes
 */
function toRad(value) {
  // Verificar que el valor es un número
  if (typeof value !== 'number' || isNaN(value)) {
    console.error(`Valor no numérico en conversión a radianes: ${value}`);
    return 0;
  }
  return value * Math.PI / 180;
}

/**
 * Calcula el tiempo estimado de viaje entre dos puntos
 * @param {number} distance - Distancia en kilómetros
 * @param {number} speedKmH - Velocidad promedio en km/h
 * @returns {number} Tiempo en horas
 */
function calculateTravelTime(distance, speedKmH = 50) {
  return distance / speedKmH;
}

/**
 * Convierte una cadena de tiempo (HH:MM) a minutos desde la medianoche
 * @param {string} timeStr - Cadena de tiempo en formato HH:MM
 * @returns {number} Minutos desde la medianoche
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;

  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;

  const [_, hours, minutes] = match;
  return parseInt(hours) * 60 + parseInt(minutes);
}

/**
 * Convierte minutos desde la medianoche a una cadena de tiempo (HH:MM)
 * @param {number} minutes - Minutos desde la medianoche
 * @returns {string} Tiempo en formato HH:MM
 */
function minutesToTime(minutes) {
  minutes = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parsea los horarios de apertura y determina si un lugar está abierto a una hora específica
 * @param {string|Object} openingHours - Texto de horarios o objeto con estructura de horarios
 * @param {string} dayOfWeek - Día de la semana (lunes, martes, etc.)
 * @param {number} timeInMinutes - Tiempo en minutos desde medianoche
 * @returns {Object} Objeto con información sobre apertura y horarios
 */
function parseOpeningHours(openingHours, dayOfWeek, timeInMinutes) {
  // Si no hay información de horarios, asumir abierto 24/7
  if (!openingHours) {
    return { isOpen: true, openTime: 0, closeTime: 24 * 60 - 1 };
  }

  // Objetos para mapear días en español
  const dayMap = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4,
    'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0, 'all': -1
  };

  // Número del día actual (0: domingo, 1: lunes, ..., 6: sábado)
  const currentDayNum = dayMap[dayOfWeek.toLowerCase()];
  if (currentDayNum === undefined) {
    return { isOpen: true, openTime: 0, closeTime: 24 * 60 - 1 };
  }

  // Caso 1: openingHours es un objeto con la estructura esperada
  if (typeof openingHours === 'object' && openingHours.weekdays) {
    const weekdays = openingHours.weekdays;

    // Verificar cada regla de días de la semana
    for (const dayRange in weekdays) {
      const timeRange = weekdays[dayRange];

      // Si está cerrado este día
      if (timeRange.toLowerCase() === 'cerrado') {
        continue;
      }

      // Si es para todos los días
      if (dayRange === 'all') {
        // Extraer horarios de apertura y cierre
        const [openTime, closeTime] = timeRange.split('-');
        const openMinutes = timeToMinutes(openTime);
        const closeMinutes = timeToMinutes(closeTime);

        // Verificar si la hora actual está dentro del horario
        const isOpenNow = timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;
        return {
          isOpen: isOpenNow,
          openTime: openMinutes,
          closeTime: closeMinutes,
          dayRange: 'todos los días'
        };
      }

      // Verificar rangos de días como "lunes-viernes"
      const rangeParts = dayRange.split('-');
      if (rangeParts.length === 2) {
        const startDay = dayMap[rangeParts[0].toLowerCase()];
        const endDay = dayMap[rangeParts[1].toLowerCase()];

        if (startDay !== undefined && endDay !== undefined) {
          // Comprobar si el día actual está en el rango
          let isDayInRange = false;

          if (startDay <= endDay) {
            isDayInRange = currentDayNum >= startDay && currentDayNum <= endDay;
          } else {
            // Rango que cruza la semana (ej: "Viernes a Lunes")
            isDayInRange = currentDayNum >= startDay || currentDayNum <= endDay;
          }

          if (isDayInRange) {
            // Extraer horarios de apertura y cierre
            const [openTime, closeTime] = timeRange.split('-');
            const openMinutes = timeToMinutes(openTime);
            const closeMinutes = timeToMinutes(closeTime);

            // Verificar si la hora actual está dentro del horario
            const isOpenNow = timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;
            return {
              isOpen: isOpenNow,
              openTime: openMinutes,
              closeTime: closeMinutes,
              dayRange: dayRange
            };
          }
        }
      } else if (dayMap[dayRange.toLowerCase()] === currentDayNum) {
        // Día específico coincide con el día actual
        // Extraer horarios de apertura y cierre
        const [openTime, closeTime] = timeRange.split('-');
        const openMinutes = timeToMinutes(openTime);
        const closeMinutes = timeToMinutes(closeTime);

        // Verificar si la hora actual está dentro del horario
        const isOpenNow = timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;
        return {
          isOpen: isOpenNow,
          openTime: openMinutes,
          closeTime: closeMinutes,
          dayRange: dayRange
        };
      }
    }

    // Si no se encuentra ninguna regla aplicable, asumir cerrado
    return { isOpen: false, openTime: null, closeTime: null };
  }

  // Caso 2: openingHours es una cadena de texto (formato antiguo)
  if (typeof openingHours === 'string') {
    const openingHoursText = openingHours;

    // Texto indica abierto 24h
    if (openingHoursText.toLowerCase().includes('abierto 24h') ||
      openingHoursText.toLowerCase().includes('24 horas')) {
      return { isOpen: true, openTime: 0, closeTime: 24 * 60 - 1 };
    }

    // Dividir por líneas o comas para procesar diferentes rangos de días
    const lines = openingHoursText.split(/\n|<br>|,/);

    for (const line of lines) {
      // Buscar patrones como "Lunes a Viernes: 10:00-19:00"
      const rangeMatch = line.match(/([^:]+):\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/i);

      if (rangeMatch) {
        const [_, dayRange, openTime, closeTime] = rangeMatch;
        const openMinutes = timeToMinutes(openTime);
        const closeMinutes = timeToMinutes(closeTime);

        // Determinar si el día actual está en el rango
        const rangeParts = dayRange.split(/\s+a\s+/i);
        if (rangeParts.length === 2) {
          const startDay = dayMap[rangeParts[0].toLowerCase()];
          const endDay = dayMap[rangeParts[1].toLowerCase()];

          if (startDay !== undefined && endDay !== undefined) {
            // Comprobar si el día actual está en el rango
            let isDayInRange = false;

            if (startDay <= endDay) {
              isDayInRange = currentDayNum >= startDay && currentDayNum <= endDay;
            } else {
              // Rango que cruza la semana (ej: "Viernes a Lunes")
              isDayInRange = currentDayNum >= startDay || currentDayNum <= endDay;
            }

            if (isDayInRange) {
              // Verificar si la hora actual está dentro del horario de apertura
              const isOpenNow = timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;
              return {
                isOpen: isOpenNow,
                openTime: openMinutes,
                closeTime: closeMinutes,
                dayRange: dayRange.trim()
              };
            }
          }
        } else if (dayRange.toLowerCase().includes(dayOfWeek.toLowerCase())) {
          // Un día específico
          const isOpenNow = timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;
          return {
            isOpen: isOpenNow,
            openTime: openMinutes,
            closeTime: closeMinutes,
            dayRange: dayRange.trim()
          };
        }
      }
    }
  }

  // Si no se encuentra un horario específico para el día actual, asumir cerrado
  return { isOpen: false, openTime: null, closeTime: null };
}

/**
 * Encuentra la primera hora disponible para visitar un lugar según su horario de apertura
 * @param {string|Object} openingHours - Horarios de apertura
 * @param {string} dayOfWeek - Día de la semana
 * @param {number} preferredTimeMinutes - Hora preferida para la visita
 * @returns {number} - Primera hora disponible en minutos o null si está cerrado todo el día
 */
function findFirstAvailableTime(openingHours, dayOfWeek, preferredTimeMinutes) {
  const hourInfo = parseOpeningHours(openingHours, dayOfWeek, preferredTimeMinutes);

  if (hourInfo.openTime === null) {
    // Lugar cerrado todo el día
    return null;
  }

  // Si la hora preferida es antes de la apertura, usar la hora de apertura
  if (preferredTimeMinutes < hourInfo.openTime) {
    return hourInfo.openTime;
  }

  // Si la hora preferida es después del cierre, no se puede visitar ese día
  if (preferredTimeMinutes >= hourInfo.closeTime) {
    return null;
  }

  // Usar la hora preferida si está dentro del horario de apertura
  return preferredTimeMinutes;
}

/**
 * Obtiene el día de la semana en español para un desplazamiento dado
 * @param {number} dayOffset - Desplazamiento de días desde hoy
 * @returns {string} - Día de la semana en español
 */
function getDayOfWeek(dayOffset = 0) {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + dayOffset);
  return days[targetDate.getDay()];
}

/**
 * Encuentra la ruta óptima usando una versión simplificada del algoritmo del vecino más cercano
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {Object} startPoint - Punto de inicio opcional
 * @param {Object} hotel - Hotel como punto de partida/regreso opcional
 * @returns {Array} Ruta optimizada con índices de orden
 */
function findOptimalRoute(places, distances, startPoint = null, hotel = null) {
  // Verificar que tenemos lugares para optimizar
  if (!places || places.length === 0) {
    console.error("No hay lugares para optimizar");
    return [];
  }

  console.log(`Optimizando ruta con ${places.length} lugares`);

  // Determinar si hay punto de inicio (hotel o startPoint)
  const hasStartingPoint = startPoint || hotel;
  const offset = hasStartingPoint ? 1 : 0; // Índice de inicio en la matriz de distancias

  try {
    // Implementación simplificada: Algoritmo del vecino más cercano
    const n = places.length;
    const visited = Array(n).fill(false);
    const route = [];

    // Comenzar desde el primer lugar (o el más cercano al punto de inicio)
    let currentIdx = 0;

    // Si hay punto de inicio, encontrar el lugar más cercano a él
    if (hasStartingPoint) {
      let minDist = Infinity;
      for (let i = 0; i < n; i++) {
        // La distancia desde el punto de inicio (índice 0 en la matriz) al lugar i+offset
        const dist = distances[0][i + offset];
        if (dist < minDist) {
          minDist = dist;
          currentIdx = i;
        }
      }
    }

    // Añadir el primer lugar a la ruta
    visited[currentIdx] = true;
    route.push(currentIdx);

    // Construir el resto de la ruta
    while (route.length < n) {
      let nextIdx = -1;
      let minDist = Infinity;

      // Encontrar el vecino más cercano no visitado
      for (let i = 0; i < n; i++) {
        if (!visited[i]) {
          // Ajustar índices para la matriz de distancias
          const fromIdx = route[route.length - 1] + offset;
          const toIdx = i + offset;

          const dist = distances[fromIdx][toIdx];
          if (dist < minDist) {
            minDist = dist;
            nextIdx = i;
          }
        }
      }

      if (nextIdx !== -1) {
        visited[nextIdx] = true;
        route.push(nextIdx);
      } else {
        // No debería ocurrir, pero por seguridad
        console.error("No se encontró siguiente lugar en la ruta");
        break;
      }
    }

    console.log(`Ruta generada con ${route.length} lugares`);

    // Construir el resultado final con la información completa
    const optimizedRoute = route.map((placeIndex, index) => {
      return {
        ...places[placeIndex],
        order_index: index,
        day: 1,                // Todos en día 1 para ruta de un solo día
        order_in_day: index    // Orden dentro del día es igual al orden global
      };
    });

    return optimizedRoute;

  } catch (error) {
    console.error("Error en algoritmo de optimización:", error);

    // En caso de error, devolver los lugares en su orden original
    return places.map((place, index) => ({
      ...place,
      order_index: index,
      day: 1,
      order_in_day: index
    }));
  }
}

/**
 * Encuentra la ruta óptima considerando múltiples días, horarios y prioridades
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {Object} startPoint - Punto de inicio opcional
 * @param {Object} hotel - Hotel como punto de partida/regreso opcional
 * @param {number} days - Número de días para distribuir la ruta
 * @param {number} maxHoursPerDay - Horas máximas de actividad por día
 * @returns {Array} Ruta optimizada con índices de orden y asignación de días
 */
function findOptimalRouteWithDays(places, distances, startPoint = null, hotel = null, days = 1, maxHoursPerDay = 8) {
  console.log(`Optimizando ruta con ${places.length} lugares para ${days} días`);

  // Si solo hay un día o pocos lugares, usar el algoritmo básico
  if (days <= 1 || places.length <= days) {
    console.log("Usando algoritmo básico por tener pocos lugares o un solo día");
    const optimizedRoute = findOptimalRoute(places, distances, startPoint, hotel);

    // Asignar día 1 a todos los lugares
    return optimizedRoute.map(place => ({
      ...place,
      day: 1
    }));
  }

  try {
    // Implementación simplificada: distribuir lugares equitativamente por días
    // Primero obtener una ruta optimizada para un solo día
    const optimizedSingleDay = findOptimalRoute(places, distances, startPoint, hotel);

    // Calcular lugares por día de forma equitativa
    const placesPerDay = Math.ceil(places.length / days);
    console.log(`Distribuyendo aproximadamente ${placesPerDay} lugares por día`);

    // Distribuir lugares en días
    const result = [];

    for (let i = 0; i < optimizedSingleDay.length; i++) {
      const place = optimizedSingleDay[i];
      const day = Math.floor(i / placesPerDay) + 1;
      const dayOrder = i % placesPerDay;

      // Asegurarse de no exceder el número de días
      const finalDay = Math.min(day, days);

      result.push({
        ...place,
        day: finalDay,
        order_in_day: dayOrder
      });
    }

    // Ordenar por día y luego por orden dentro del día
    result.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.order_in_day - b.order_in_day;
    });

    // Actualizar order_index global
    result.forEach((place, index) => {
      place.order_index = index;
    });

    console.log(`Ruta optimizada generada para ${days} días`);
    return result;

  } catch (error) {
    console.error("Error en algoritmo de optimización multidía:", error);

    // En caso de error, devolver una distribución simple
    const result = [];
    const placesPerDay = Math.ceil(places.length / days);

    for (let i = 0; i < places.length; i++) {
      const day = Math.min(Math.floor(i / placesPerDay) + 1, days);
      result.push({
        ...places[i],
        day: day,
        order_index: i,
        order_in_day: i % placesPerDay
      });
    }

    return result;
  }
}

module.exports = routeRoutes; 