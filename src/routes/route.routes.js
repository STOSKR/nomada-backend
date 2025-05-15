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
            title: { type: 'string' },
            description: { type: 'string' }, // Nuevo campo descripción
            is_public: { type: 'boolean' },
            likes_count: { type: 'integer' },
            saved_count: { type: 'integer' },
            comments_count: { type: 'integer' },
            cover_image: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            location: { type: 'string', nullable: true },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              },
              nullable: true
            },
            photos: { // Nueva colección de fotos
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  public_url: { type: 'string' },
                  order_index: { type: 'integer' }
                }
              }
            },
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
          title: { type: 'string' },
          description: { type: 'string' },  // Nuevo campo descripción
          is_public: { type: 'boolean' },
          likes_count: { type: 'integer' },
          saved_count: { type: 'integer' },
          comments_count: { type: 'integer' },
          cover_image: { type: 'string' },
          location: { type: 'string', nullable: true },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' }
            },
            nullable: true
          },
          created_at: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              full_name: { type: 'string' },
              nomada_id: { type: 'string' },
              avatar_url: { type: 'string' }
            }
          },
          photos: {  // Nueva colección de fotos para la ruta
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                public_url: { type: 'string' },
                order_index: { type: 'integer' }
              }
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
      required: ['title', 'location'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        is_public: { type: 'boolean', default: true },
        cover_image: { type: 'string' },
        location: { type: 'string' },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        photos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' }
            }
          }
        },
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
              photos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' }
                  }
                }
              },
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
              id: { type: 'string' },
              days_count: { type: 'integer' },
              places_count: { type: 'integer' }
            }
          }
        }
      }
    }
  },

  // Esquema para actualizar una ruta
  updateRoute: {
    description: 'Actualizar una ruta existente',
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
        description: { type: 'string' },  // Nuevo campo descripción
        is_public: { type: 'boolean' },
        cover_image: { type: 'string' },
        location: { type: 'string' },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        photos: {  // Nueva colección de fotos
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' }
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
  },

  // Schema para obtener todas las rutas ordenadas cronológicamente
  getAllRoutes: {
    description: 'Obtener todas las rutas públicas ordenadas cronológicamente de reciente a antiguo',
    tags: ['rutas'],
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
            title: { type: 'string' },
            description: { type: 'string' },
            is_public: { type: 'boolean' },
            likes_count: { type: 'integer' },
            saved_count: { type: 'integer' },
            comments_count: { type: 'integer' },
            days_count: { type: 'integer' },
            places_count: { type: 'integer' },
            cover_image: { type: 'string' },
            location: { type: 'string', nullable: true },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              },
              nullable: true
            },
            created_at: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nomada_id: { type: 'string' },
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

  // Obtener todas las rutas públicas ordenadas cronológicamente
  fastify.get('/all', {
    schema: schemas.getAllRoutes,
    preValidation: [fastify.authenticateOptional]
  }, async function (request, reply) {
    try {
      const { limit = 20, offset = 0 } = request.query;
      const filters = {
        limit,
        offset
      };

      // El userId ya no es relevante porque solo se muestran rutas públicas
      const routeService = new RouteService(this.supabase);
      const routes = await routeService.getAllRoutes(filters);

      // Si no hay days_count o places_count, calcularlos al vuelo
      const routesWithCounts = await Promise.all(routes.map(async (route) => {
        if (typeof route.days_count === 'undefined' || typeof route.places_count === 'undefined') {
          // Obtener los lugares de la ruta
          const places = await this.supabase
            .from('places')
            .select('day_number')
            .eq('route_id', route.id);

          const placesData = places.data || [];

          return {
            ...route,
            days_count: placesData.length > 0 ?
              Math.max(...placesData.map(place => place.day_number || 1)) : 1,
            places_count: placesData.length
          };
        }
        return route;
      }));

      return reply.code(200).send(routesWithCounts);
    } catch (error) {
      request.log.error('Error al obtener todas las rutas públicas:', error);

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
      const route = await routeService.getRouteDetail(routeId, userId);

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

      // Calcular automáticamente el número de días y lugares
      const places = routeData.places;
      const days_count = places.length > 0 ?
        Math.max(...places.map(place => place.day_number || 1)) : 1;
      const places_count = places.length;

      // Agregar los conteos al routeData
      routeData.days_count = days_count;
      routeData.places_count = places_count;

      // Si no hay coordenadas definidas y hay lugares, usar las del primer lugar con una variación aleatoria
      if (!routeData.coordinates && places.length > 0 && places[0].coordinates) {
        const firstPlace = places[0];
        const randomOffset = Math.random() * 0.001 - 0.0005; // Valor aleatorio entre -0.0005 y 0.0005

        // Extraer lat y lng del primer lugar
        let lat, lng;

        // Si las coordenadas vienen como string "(lat,lng)", extraerlas
        if (typeof firstPlace.coordinates === 'string') {
          const match = firstPlace.coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
          if (match) {
            lng = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          }
        } else if (firstPlace.coordinates.lat && firstPlace.coordinates.lng) {
          // Si vienen como objeto {lat, lng}
          lat = firstPlace.coordinates.lat;
          lng = firstPlace.coordinates.lng;
        }

        // Si se pudieron extraer las coordenadas, generar con variación aleatoria
        if (lat && lng) {
          routeData.coordinates = {
            lat: lat + randomOffset,
            lng: lng + randomOffset
          };
          console.log(`Coordenadas generadas automáticamente: ${JSON.stringify(routeData.coordinates)}`);
        }
      }

      // Si no hay location definida y hay lugares, usar la dirección o nombre del primer lugar
      if (!routeData.location && places.length > 0) {
        const firstPlace = places[0];
        // Preferir la dirección, si no existe usar el nombre
        routeData.location = firstPlace.address || firstPlace.name || 'Ubicación sin especificar';
        console.log(`Location generada automáticamente: ${routeData.location}`);
      }

      const routeService = new RouteService(fastify.supabase);
      const route = await routeService.createRoute(routeData, userId);

      return reply.code(201).send({
        success: true,
        message: 'Ruta creada correctamente',
        route: {
          id: route.id,
          days_count: days_count,
          places_count: places_count
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
  }, async function (request, reply) {
    try {
      const routeId = request.params.id;
      const userId = request.user.id;
      const routeData = request.body;

      // Si hay lugares en la actualización, recalcular los conteos
      if (routeData.places && Array.isArray(routeData.places)) {
        const places = routeData.places;
        routeData.days_count = places.length > 0 ?
          Math.max(...places.map(place => place.day_number || 1)) : 1;
        routeData.places_count = places.length;
      }

      const routeService = new RouteService(this.supabase);
      const result = await routeService.updateRoute(routeId, routeData, userId);

      return reply.code(200).send({
        ...result,
        days_count: routeData.days_count,
        places_count: routeData.places_count
      });
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

      return reply.send({
        routeId: routeId,
        places: places
      });
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
 * Encuentra la ruta óptima usando una aproximación más inteligente para evitar zigzags
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

  console.log(`Optimizando ruta con ${places.length} lugares, buscando recorrido lineal`);

  try {
    // PASO 1: Determinar si hay punto de inicio (hotel o startPoint)
    const hasStartingPoint = startPoint || hotel;
    const startCoordinates = hasStartingPoint ?
      (hotel ? hotel.coordinates : startPoint) : null;

    // PASO 2: Analizar la distribución espacial para encontrar un eje principal
    // Extraer todas las coordenadas
    const coordinates = places.map(place => place.coordinates);

    // Calcular el rango y dispersión en cada eje (latitud y longitud)
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.lat);
      maxLat = Math.max(maxLat, coord.lat);
      minLng = Math.min(minLng, coord.lng);
      maxLng = Math.max(maxLng, coord.lng);
    });

    // Determinar si la dispersión es mayor en latitud o longitud
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    console.log(`Análisis de dispersión: Rango Lat=${latRange.toFixed(4)}, Rango Lng=${lngRange.toFixed(4)}`);

    // PASO 3: Ordenar lugares según el eje principal de distribución
    let orderedPlaces = [];
    if (lngRange > latRange) {
      // Mayor dispersión este-oeste (longitud)
      console.log("Distribución principal: Este-Oeste (longitudinal)");
      orderedPlaces = [...places].sort((a, b) => a.coordinates.lng - b.coordinates.lng);
    } else {
      // Mayor dispersión norte-sur (latitud)
      console.log("Distribución principal: Norte-Sur (latitudinal)");
      orderedPlaces = [...places].sort((a, b) => a.coordinates.lat - b.coordinates.lat);
    }

    // PASO 4: Si hay punto de inicio, ajustar el recorrido para empezar por el extremo más cercano
    if (hasStartingPoint) {
      // Determinar qué extremo está más cerca del punto de inicio
      const firstPoint = orderedPlaces[0].coordinates;
      const lastPoint = orderedPlaces[orderedPlaces.length - 1].coordinates;

      const distToFirst = calculateDistance(startCoordinates, firstPoint);
      const distToLast = calculateDistance(startCoordinates, lastPoint);

      console.log(`Distancia a primer punto: ${distToFirst.toFixed(2)}km, a último punto: ${distToLast.toFixed(2)}km`);

      // Si el último punto está más cerca del inicio, invertir el orden
      if (distToLast < distToFirst) {
        console.log("Invirtiendo orden para empezar por el extremo más cercano al punto de inicio");
        orderedPlaces.reverse();
      }
    }

    // PASO 5: Construir resultado con orden optimizado
    const result = orderedPlaces.map((place, index) => {
      // Buscar el índice original del lugar para referencias
      const originalIndex = places.findIndex(p =>
        p.coordinates.lat === place.coordinates.lat &&
        p.coordinates.lng === place.coordinates.lng);

      return {
        ...place,
        order_index: index,
        day: 1,                // Todos en día 1 para ruta de un solo día
        order_in_day: index,    // Orden dentro del día es igual al orden global
        _originalIndex: originalIndex // Para referencia interna
      };
    });

    // PASO 6: Calcular y mostrar la distancia total de la ruta optimizada
    let totalDistance = 0;
    for (let i = 0; i < result.length - 1; i++) {
      const currentIdx = result[i]._originalIndex;
      const nextIdx = result[i + 1]._originalIndex;
      totalDistance += distances[currentIdx + (hasStartingPoint ? 1 : 0)][nextIdx + (hasStartingPoint ? 1 : 0)];
    }

    console.log(`Ruta lineal generada. Distancia total: ${totalDistance.toFixed(2)}km`);

    // Eliminar propiedad temporal
    result.forEach(place => delete place._originalIndex);

    return result;
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
    // PASO 1: Analizar la distribución espacial para encontrar un eje principal
    // Extraer todas las coordenadas
    const coordinates = places.map(place => place.coordinates);

    // Calcular el rango y dispersión en cada eje (latitud y longitud)
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.lat);
      maxLat = Math.max(maxLat, coord.lat);
      minLng = Math.min(minLng, coord.lng);
      maxLng = Math.max(maxLng, coord.lng);
    });

    // Determinar si la dispersión es mayor en latitud o longitud
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    console.log(`Análisis de dispersión: Rango Lat=${latRange.toFixed(4)}, Rango Lng=${lngRange.toFixed(4)}`);

    // PASO 2: Crear clusters geográficos más inteligentes basados en el eje principal
    let clusters = [];
    if (lngRange > latRange) {
      // Mayor dispersión este-oeste
      console.log("Distribución principal: Este-Oeste (longitudinal)");

      // Ordenar lugares de oeste a este
      const sortedPlaces = [...places].map((place, idx) => ({
        ...place,
        originalIndex: idx
      })).sort((a, b) => a.coordinates.lng - b.coordinates.lng);

      // Dividir en secciones geográficas para cada día
      const placesPerCluster = Math.ceil(sortedPlaces.length / days);
      for (let i = 0; i < days; i++) {
        const start = i * placesPerCluster;
        const end = Math.min(start + placesPerCluster, sortedPlaces.length);
        const cluster = sortedPlaces.slice(start, end).map(p => p.originalIndex);
        clusters.push(cluster);
      }
    } else {
      // Mayor dispersión norte-sur
      console.log("Distribución principal: Norte-Sur (latitudinal)");

      // Ordenar lugares de norte a sur
      const sortedPlaces = [...places].map((place, idx) => ({
        ...place,
        originalIndex: idx
      })).sort((a, b) => a.coordinates.lat - b.coordinates.lat);

      // Dividir en secciones geográficas para cada día
      const placesPerCluster = Math.ceil(sortedPlaces.length / days);
      for (let i = 0; i < days; i++) {
        const start = i * placesPerCluster;
        const end = Math.min(start + placesPerCluster, sortedPlaces.length);
        const cluster = sortedPlaces.slice(start, end).map(p => p.originalIndex);
        clusters.push(cluster);
      }
    }

    console.log("Clusters generados basados en distribución espacial:");
    clusters.forEach((cluster, i) => {
      console.log(`  Día ${i + 1}: ${cluster.length} lugares`);
    });

    // PASO 3: Optimizar el orden de visita dentro de cada día
    const result = [];

    for (let dayNum = 1; dayNum <= days; dayNum++) {
      const dayIndices = clusters[dayNum - 1] || [];

      if (dayIndices.length === 0) continue;

      console.log(`Optimizando día ${dayNum} con ${dayIndices.length} lugares`);

      // Extraer lugares para este día
      const dayPlaces = dayIndices.map(idx => {
        const place = { ...places[idx] };
        place.originalIndex = idx; // Guardar el índice original
        return place;
      });

      // Ordenar lugares en este día según el mismo eje principal
      if (lngRange > latRange) {
        // Ordenar oeste a este o este a oeste (según qué extremo esté más cerca del hotel)
        dayPlaces.sort((a, b) => a.coordinates.lng - b.coordinates.lng);
      } else {
        // Ordenar norte a sur o sur a norte
        dayPlaces.sort((a, b) => a.coordinates.lat - b.coordinates.lat);
      }

      // Si hay hotel, ajustar para empezar por el extremo más cercano
      if (hotel && dayPlaces.length > 1) {
        const hotelCoord = hotel.coordinates;
        const firstPlace = dayPlaces[0];
        const lastPlace = dayPlaces[dayPlaces.length - 1];

        const distToFirst = calculateDistance(hotelCoord, firstPlace.coordinates);
        const distToLast = calculateDistance(hotelCoord, lastPlace.coordinates);

        // Invertir si el extremo final está más cerca del hotel
        if (distToLast < distToFirst) {
          dayPlaces.reverse();
        }
      }

      // Añadir lugares ordenados al resultado final
      for (let j = 0; j < dayPlaces.length; j++) {
        const placeObj = dayPlaces[j];
        const placeIndex = placeObj.originalIndex;

        result.push({
          ...places[placeIndex],
          day: dayNum,
          order_in_day: j,
          order_index: result.length
        });
      }
    }

    // Actualizar order_index global para garantizar consistencia
    result.forEach((place, index) => {
      place.order_index = index;
    });

    console.log(`Ruta optimizada generada para ${days} días con recorrido lineal`);
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

/**
 * Construye un grafo donde cada nodo (lugar) está conectado a sus N vecinos más cercanos
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias entre lugares
 * @param {number} numNeighbors - Número de vecinos a considerar por lugar
 * @returns {Object} Grafo de adyacencias
 */
function buildNearestNeighborsGraph(places, distances, numNeighbors = 3) {
  const n = places.length;
  const graph = {};

  for (let i = 0; i < n; i++) {
    // Para cada lugar, ordenar todos los demás por distancia
    const neighbors = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        neighbors.push({
          index: j,
          distance: distances[i][j]
        });
      }
    }

    // Ordenar por distancia y tomar los N más cercanos
    neighbors.sort((a, b) => a.distance - b.distance);
    const nearestNeighbors = neighbors.slice(0, Math.min(numNeighbors, neighbors.length));

    // Guardar los índices de los vecinos más cercanos
    graph[i] = nearestNeighbors.map(neighbor => neighbor.index);
  }

  return graph;
}

/**
 * Crea clusters de lugares basados en proximidad geográfica
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {number} numClusters - Número de clusters a crear
 * @returns {Array} Array de clusters (cada cluster es un array de índices de lugares)
 */
function createProximityClusters(places, distances, numClusters) {
  const n = places.length;

  // Si hay menos lugares que clusters solicitados
  if (n <= numClusters) {
    return places.map((_, i) => [i]);
  }

  // Implementar un enfoque de separación geográfica más estricto

  // 1. Encontrar el par de lugares más distantes entre sí
  let maxDist = -1;
  let point1 = 0;
  let point2 = 1;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (distances[i][j] > maxDist) {
        maxDist = distances[i][j];
        point1 = i;
        point2 = j;
      }
    }
  }

  console.log(`Puntos más distantes: ${point1} y ${point2} con distancia ${maxDist.toFixed(2)} km`);

  // 2. Crear dos clusters iniciales basados en estos puntos extremos
  const clusters = [];
  clusters[0] = [point1];
  clusters[1] = [point2];

  // Conjunto de lugares ya asignados
  const assigned = new Set([point1, point2]);

  // 3. Asignar cada punto al cluster con el centro más cercano
  while (assigned.size < n) {
    let bestPoint = -1;
    let bestCluster = 0;
    let minDist = Infinity;

    // Primero, encontrar el lugar no asignado más cercano a cualquier lugar ya asignado
    for (let i = 0; i < n; i++) {
      if (assigned.has(i)) continue;

      for (let clusterId = 0; clusterId < clusters.length; clusterId++) {
        for (const assignedPoint of clusters[clusterId]) {
          const dist = distances[i][assignedPoint];
          if (dist < minDist) {
            minDist = dist;
            bestPoint = i;
            bestCluster = clusterId;
          }
        }
      }
    }

    if (bestPoint !== -1) {
      clusters[bestCluster].push(bestPoint);
      assigned.add(bestPoint);
      console.log(`Asignando punto ${bestPoint} al cluster ${bestCluster} con distancia ${minDist.toFixed(2)} km`);
    }
  }

  // 4. Si necesitamos más clusters, dividir los existentes
  while (clusters.length < numClusters) {
    // Encontrar el cluster más grande para dividirlo
    let largestCluster = 0;
    let maxSize = 0;

    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].length > maxSize) {
        maxSize = clusters[i].length;
        largestCluster = i;
      }
    }

    // Si no podemos dividir más, salir
    if (clusters[largestCluster].length <= 1) break;

    // Dividir el cluster más grande en dos
    const clusterToSplit = clusters[largestCluster];

    // Calcular distancias dentro del cluster
    const intraClusterDistances = [];
    for (let i = 0; i < clusterToSplit.length; i++) {
      for (let j = i + 1; j < clusterToSplit.length; j++) {
        intraClusterDistances.push({
          i: clusterToSplit[i],
          j: clusterToSplit[j],
          dist: distances[clusterToSplit[i]][clusterToSplit[j]]
        });
      }
    }

    // Encontrar los dos puntos más distantes dentro del cluster
    intraClusterDistances.sort((a, b) => b.dist - a.dist);

    if (intraClusterDistances.length > 0) {
      const { i, j } = intraClusterDistances[0];

      // Crear dos nuevos clusters
      const newCluster1 = [i];
      const newCluster2 = [j];

      // Distribuir el resto de puntos
      for (const point of clusterToSplit) {
        if (point !== i && point !== j) {
          const distToI = distances[point][i];
          const distToJ = distances[point][j];

          if (distToI < distToJ) {
            newCluster1.push(point);
          } else {
            newCluster2.push(point);
          }
        }
      }

      // Reemplazar el cluster original por los dos nuevos
      clusters.splice(largestCluster, 1, newCluster1, newCluster2);
    } else {
      // Si no podemos dividir más, salir
      break;
    }
  }

  // Asegurarnos de que no haya clusters vacíos
  return clusters.filter(cluster => cluster.length > 0);
}

/**
 * Optimiza el orden de visita de lugares dentro de un día usando el algoritmo más efectivo para minimizar distancia total
 * @param {Array} places - Array de lugares para el día
 * @param {Array} distances - Matriz de distancias
 * @param {number|null} startIdx - Índice del punto de inicio (hotel/startPoint)
 * @returns {Array} Array de índices ordenados para visitar los lugares
 */
function optimizeDayOrder(places, distances, startIdx = null) {
  const n = places.length;

  // Si hay muy pocos lugares, no es necesario optimizar
  if (n <= 2) {
    return Array.from({ length: n }, (_, i) => i);
  }

  console.log(`Optimizando orden de ${n} lugares dentro del día`);

  // Implementar una versión mejorada para encontrar la ruta más corta
  // Usaremos una combinación de vecino más cercano con optimizaciones locales

  // FASE 1: Construir ruta inicial con algoritmo del vecino más cercano
  const visited = Array(n).fill(false);
  const route = [];
  let totalDistance = 0;

  // Determinar punto de inicio (desde hotel o primer lugar)
  let currentIdx = 0;

  // Si hay punto de inicio (hotel), encontrar el lugar más cercano a él
  if (startIdx !== null) {
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dist = distances[startIdx][i + (startIdx === 0 ? 1 : 0)];
      if (dist < minDist) {
        minDist = dist;
        currentIdx = i;
      }
    }
  }

  // Añadir el primer lugar
  visited[currentIdx] = true;
  route.push(currentIdx);

  // Construir el resto de la ruta con el vecino más cercano
  while (route.length < n) {
    let nextIdx = -1;
    let minDist = Infinity;

    // Encontrar el vecino más cercano no visitado
    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        const dist = distances[currentIdx + (startIdx === 0 ? 1 : 0)][i + (startIdx === 0 ? 1 : 0)];
        if (dist < minDist) {
          minDist = dist;
          nextIdx = i;
        }
      }
    }

    if (nextIdx !== -1) {
      visited[nextIdx] = true;
      route.push(nextIdx);
      totalDistance += minDist;
      currentIdx = nextIdx;
    } else {
      break;
    }
  }

  console.log(`Ruta inicial con distancia total: ${totalDistance.toFixed(2)} km`);

  // FASE 2: Mejorar la ruta con optimizaciones locales (2-opt)
  let improved = true;
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Evitar bucles infinitos

  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    iterations++;

    // Intentar intercambiar pares de aristas para reducir la distancia total
    for (let i = 0; i < n - 2; i++) {
      for (let j = i + 2; j < n; j++) {
        // Calcular la distancia actual entre los segmentos (i,i+1) y (j,j+1)
        const idx1 = route[i];
        const idx2 = route[i + 1];
        const idx3 = route[j];
        const idx4 = j < n - 1 ? route[j + 1] : route[0]; // Cerrar el ciclo si es el último

        // Ajustar índices para la matriz de distancias
        const adjust = startIdx === 0 ? 1 : 0;

        // Distancia actual: d(1,2) + d(3,4)
        const currentDist =
          distances[idx1 + adjust][idx2 + adjust] +
          distances[idx3 + adjust][idx4 + adjust];

        // Distancia si intercambiamos: d(1,3) + d(2,4)
        const newDist =
          distances[idx1 + adjust][idx3 + adjust] +
          distances[idx2 + adjust][idx4 + adjust];

        // Si mejora, hacer el intercambio
        if (newDist < currentDist) {
          // Invertir la parte de la ruta entre i+1 y j
          reverse(route, i + 1, j);
          improved = true;

          // Actualizar distancia total
          totalDistance = calculateTotalDistance(route, distances, startIdx);

          console.log(`Iteración ${iterations}: Mejora encontrada, nueva distancia: ${totalDistance.toFixed(2)} km`);
          break; // Reiniciar desde el principio
        }
      }
      if (improved) break;
    }
  }

  console.log(`Optimización completada en ${iterations} iteraciones, distancia final: ${totalDistance.toFixed(2)} km`);
  return route;
}

/**
 * Invierte una sección de un array in-place
 * @param {Array} arr - Array a modificar
 * @param {number} start - Índice de inicio
 * @param {number} end - Índice final
 */
function reverse(arr, start, end) {
  while (start < end) {
    const temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
  }
}

/**
 * Calcula la distancia total de una ruta
 * @param {Array} route - Array de índices que forma la ruta
 * @param {Array} distances - Matriz de distancias
 * @param {number|null} startIdx - Índice del punto de inicio (hotel/startPoint) 
 * @returns {number} Distancia total
 */
function calculateTotalDistance(route, distances, startIdx = null) {
  const n = route.length;
  let totalDist = 0;
  const adjust = startIdx === 0 ? 1 : 0;

  for (let i = 0; i < n - 1; i++) {
    totalDist += distances[route[i] + adjust][route[i + 1] + adjust];
  }

  // Si hay un punto de inicio/hotel, añadir la distancia al primer y último lugar
  if (startIdx === 0) {
    totalDist += distances[0][route[0] + 1]; // Desde hotel al primer lugar
    totalDist += distances[route[n - 1] + 1][0]; // Desde último lugar al hotel
  }

  return totalDist;
}

/**
 * Selecciona puntos distantes entre sí para usar como puntos de partida de cada día
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {number} numPoints - Número de puntos a seleccionar
 * @returns {Array} Índices de los puntos seleccionados
 */
function selectDistantStartingPoints(places, distances, numPoints) {
  const n = places.length;

  // Si tenemos pocos lugares, devolver todos
  if (n <= numPoints) {
    return Array.from({ length: n }, (_, i) => i);
  }

  // Empezar con el lugar que tenga más duración (visita más larga)
  let firstPoint = 0;
  let maxDuration = 0;

  for (let i = 0; i < n; i++) {
    const duration = places[i].visitDuration || 1;
    if (places[i].isEssential && duration > maxDuration) {
      maxDuration = duration;
      firstPoint = i;
    }
  }

  if (maxDuration === 0) {
    // Si no hay lugares esenciales, tomar el de mayor duración
    for (let i = 0; i < n; i++) {
      const duration = places[i].visitDuration || 1;
      if (duration > maxDuration) {
        maxDuration = duration;
        firstPoint = i;
      }
    }
  }

  const selected = [firstPoint];

  // Seleccionar el resto de puntos lo más alejados posible de los ya seleccionados
  while (selected.length < numPoints) {
    let maxMinDistance = -1;
    let bestPoint = -1;

    for (let i = 0; i < n; i++) {
      if (selected.includes(i)) continue;

      // Calcular la distancia mínima a cualquier punto ya seleccionado
      let minDist = Infinity;
      for (const pointIdx of selected) {
        if (distances[i][pointIdx] < minDist) {
          minDist = distances[i][pointIdx];
        }
      }

      // Preferir puntos que estén lejos de todos los ya seleccionados
      if (minDist > maxMinDistance) {
        maxMinDistance = minDist;
        bestPoint = i;
      }
    }

    if (bestPoint !== -1) {
      selected.push(bestPoint);
    } else {
      break; // No deberíamos llegar aquí
    }
  }

  // Si no tenemos suficientes puntos, añadir algunos arbitrariamente
  while (selected.length < numPoints && selected.length < n) {
    for (let i = 0; i < n; i++) {
      if (!selected.includes(i)) {
        selected.push(i);
        if (selected.length >= numPoints) break;
      }
    }
  }

  return selected;
}

/**
 * Calcula una matriz de distancias simple entre un conjunto de puntos
 * @param {Array} points - Array de puntos con coordenadas {lat, lng}
 * @returns {Array} Matriz de distancias
 */
function calculateDistanceMatrixSimple(points) {
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

  return distances;
}

/**
 * Asigna lugares a días balanceando proximidad y duración
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {Object} graph - Grafo de vecinos cercanos
 * @param {number} numDays - Número de días disponibles
 * @param {number} maxHoursPerDay - Máximo de horas por día
 * @returns {Array} Array de asignaciones {placeIndex, day}
 */
function balanceDaysAssignment(places, distances, graph, numDays, maxHoursPerDay) {
  const n = places.length;

  // Inicializar estructura para asignaciones
  const assignments = [];

  // Calcular el tiempo total de todas las visitas
  const totalDuration = places.reduce((sum, place) => sum + (place.visitDuration || 1), 0);

  // Duración ideal por día para equilibrar
  const targetDurationPerDay = totalDuration / numDays;
  console.log(`Duración total: ${totalDuration} horas, Objetivo por día: ${targetDurationPerDay} horas`);

  // Lugares por día óptimo
  const placesPerDay = Math.ceil(n / numDays);
  console.log(`Lugares totales: ${n}, Objetivo de lugares por día: ${placesPerDay}`);

  // Crear clusters de lugares cercanos
  const clusters = createProximityClusters(places, distances, numDays);
  console.log(`Creados ${clusters.length} clusters de lugares cercanos`);
  clusters.forEach((cluster, i) => {
    console.log(`  Cluster ${i + 1}: ${cluster.length} lugares - Índices: ${cluster.join(', ')}`);
  });

  // Inicializar días con los lugares de cada cluster
  const days = Array(numDays).fill().map((_, i) => ({
    dayNum: i + 1,
    places: i < clusters.length ? [...clusters[i]] : [],
    currentDuration: 0,
    maxDuration: Math.min(maxHoursPerDay, targetDurationPerDay * 1.5), // Permitir algo de flexibilidad
    maxPlaces: Math.ceil(places.length / numDays) + 1 // Límite de lugares por día más flexible
  }));

  // Calcular la duración total para cada día
  days.forEach(day => {
    day.currentDuration = day.places.reduce((sum, idx) =>
      sum + (places[idx].visitDuration || 1), 0);
  });

  // Crear conjunto de lugares ya asignados
  const assignedPlaces = new Set();
  days.forEach(day => {
    day.places.forEach(placeIdx => {
      assignedPlaces.add(placeIdx);
    });
  });

  // Distribución inicial más equilibrada
  // Redistribuir lugares de días con exceso a días con menos lugares
  let perfectlyBalanced = false;
  let iterationCount = 0;
  const maxIterations = 10; // Evitar bucles infinitos

  while (!perfectlyBalanced && iterationCount < maxIterations) {
    perfectlyBalanced = true;
    iterationCount++;

    // Ordenar días por cantidad de lugares (descendente)
    days.sort((a, b) => b.places.length - a.places.length);

    // Verificar si hay desbalance significativo
    const maxPlacesInDay = days[0].places.length;
    const minPlacesInDay = days[numDays - 1].places.length;

    // Consideramos desbalance si la diferencia es mayor a 2 lugares
    if (maxPlacesInDay - minPlacesInDay > 2) {
      perfectlyBalanced = false;

      // Mover lugares de días con exceso a días con menos lugares
      for (let i = 0; i < Math.min(3, days.length); i++) {
        const sourceDay = days[i]; // Día con más lugares

        // Si este día no tiene exceso, continuamos
        if (sourceDay.places.length <= placesPerDay + 1) continue;

        for (let j = days.length - 1; j >= Math.max(0, days.length - 3); j--) {
          const targetDay = days[j]; // Día con menos lugares

          // No transferir si no hay suficiente diferencia
          if (sourceDay.places.length - targetDay.places.length <= 2) continue;

          // Encontrar el lugar que mejor convenga mover (el más cercano a los lugares del día destino)
          let bestPlaceIndex = -1;
          let bestScore = Infinity;

          for (const placeIdx of sourceDay.places) {
            // Calcular proximidad a lugares en el día destino
            let avgDist = 0;
            if (targetDay.places.length > 0) {
              let totalDist = 0;
              for (const targetPlaceIdx of targetDay.places) {
                totalDist += distances[placeIdx][targetPlaceIdx];
              }
              avgDist = totalDist / targetDay.places.length;
            }

            // Considerar también proximidad a lugares en el día origen
            // para no romper clusters lógicos
            let avgOriginalDist = 0;
            if (sourceDay.places.length > 1) {
              let totalOriginalDist = 0;
              for (const originalPlaceIdx of sourceDay.places) {
                if (originalPlaceIdx !== placeIdx) {
                  totalOriginalDist += distances[placeIdx][originalPlaceIdx];
                }
              }
              avgOriginalDist = totalOriginalDist / (sourceDay.places.length - 1);
            }

            // Preferimos lugares menos conectados al día actual
            // y más cercanos al día destino
            const score = avgDist - avgOriginalDist;

            if (score < bestScore) {
              bestScore = score;
              bestPlaceIndex = placeIdx;
            }
          }

          // Transferir el lugar
          if (bestPlaceIndex !== -1) {
            console.log(`Moviendo lugar ${bestPlaceIndex} del día ${sourceDay.dayNum} al día ${targetDay.dayNum}`);

            // Eliminar del día origen
            sourceDay.places = sourceDay.places.filter(idx => idx !== bestPlaceIndex);
            sourceDay.currentDuration -= (places[bestPlaceIndex].visitDuration || 1);

            // Añadir al día destino
            targetDay.places.push(bestPlaceIndex);
            targetDay.currentDuration += (places[bestPlaceIndex].visitDuration || 1);

            break; // Solo mover un lugar a la vez para mantener control
          }
        }
      }
    }
  }

  // Si hay lugares no asignados (podría pasar en casos extremos)
  for (let i = 0; i < n; i++) {
    if (!assignedPlaces.has(i)) {
      // Encontrar el día con menos lugares
      let bestDay = 0;
      let minPlaces = Infinity;

      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const day = days[dayIdx];
        if (day.places.length < minPlaces) {
          minPlaces = day.places.length;
          bestDay = dayIdx;
        }
      }

      // Asignar al día con menos lugares
      days[bestDay].places.push(i);
      days[bestDay].currentDuration += (places[i].visitDuration || 1);
      assignedPlaces.add(i);
    }
  }

  // Volver a ordenar los días por número de día
  days.sort((a, b) => a.dayNum - b.dayNum);

  // Construir el array de asignaciones
  days.forEach(day => {
    day.places.forEach(placeIdx => {
      assignments.push({ placeIndex: placeIdx, day: day.dayNum });
    });
  });

  // Registrar la distribución final
  days.forEach(day => {
    const placeNames = day.places.map(idx => {
      // Extraer nombre corto para legibilidad
      let name = places[idx].name || `Lugar ${idx}`;
      if (name.length > 30) name = name.substring(0, 27) + '...';
      return name;
    });

    console.log(`Día ${day.dayNum}: ${day.places.length} lugares, ${day.currentDuration.toFixed(1)} horas`);
    console.log(`  - Lugares: ${placeNames.join(', ')}`);
  });

  return assignments;
}

module.exports = routeRoutes; 