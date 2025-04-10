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
  
  // Optimizar ruta (orden de visita de lugares)
  fastify.post('/optimizar', {
    schema: schemas.optimizeRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { places, startPoint, hotel, days = 1, maxHoursPerDay = 8 } = request.body;
      
      if (!places || places.length < 2) {
        return reply.code(400).send({
          success: false,
          message: 'Se requieren al menos 2 lugares para optimizar una ruta'
        });
      }
      
      // Calcular distancias entre todos los puntos
      const distances = calculateDistanceMatrix(places, startPoint, hotel);
      
      // Aplicar algoritmo del vecino más cercano para encontrar la ruta óptima
      let optimizedRoute;
      
      if (days > 1) {
        // Si se especifican días, usar la versión del algoritmo con distribución por días
        optimizedRoute = findOptimalRouteWithDays(places, distances, startPoint, hotel, days, maxHoursPerDay);
      } else {
        // Usar el algoritmo original para un solo día
        optimizedRoute = findOptimalRoute(places, distances, startPoint, hotel);
      }
      
      return {
        success: true,
        optimizedRoute
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
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
  // Si hay hotel, lo usamos como punto de inicio en lugar del startPoint
  const actualStartPoint = hotel ? hotel.coordinates : startPoint;
  
  // Crear la lista completa de puntos
  const points = [];
  
  // Añadir el punto de inicio si existe
  if (actualStartPoint) {
    points.push(actualStartPoint);
  }
  
  // Añadir todos los lugares
  places.forEach(place => {
    points.push(place.coordinates);
  });
  
  // Calcular la matriz de distancias
  const n = points.length;
  const distances = Array(n).fill().map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distances[i][j] = calculateDistance(points[i], points[j]);
      }
    }
  }
  
  return distances;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Object} point1 - Primer punto {lat, lng}
 * @param {Object} point2 - Segundo punto {lat, lng}
 * @returns {number} Distancia en kilómetros
 */
function calculateDistance(point1, point2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convierte grados a radianes
 * @param {number} value - Valor en grados
 * @returns {number} Valor en radianes
 */
function toRad(value) {
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
 * Encuentra la ruta óptima usando una combinación de vecino más cercano y optimización 2-opt
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {Object} startPoint - Punto de inicio opcional
 * @param {Object} hotel - Hotel como punto de partida/regreso opcional
 * @returns {Array} Ruta optimizada con índices de orden
 */
function findOptimalRoute(places, distances, startPoint = null, hotel = null) {
  // Usar hotel como punto de inicio si está definido
  const hasStartingPoint = startPoint || hotel;
  
  // Agrupar lugares por proximidad geográfica antes de optimizar
  const clusters = groupPlacesByProximity(places);
  
  // Índice de inicio (0 si hay punto de inicio, cualquier punto si no hay)
  const offset = hasStartingPoint ? 1 : 0;
  
  // Array de índices para la ruta final
  let route = [];
  
  // Ordenar clusters por distancia al punto de inicio o al primer cluster
  const orderedClusters = orderClustersByProximity(clusters, distances, hasStartingPoint ? 0 : null);
  
  // Construir la ruta respetando los clusters (grupos de proximidad)
  for (const cluster of orderedClusters) {
    // Optimizar internamente cada cluster
    const clusterRoute = optimizeCluster(cluster, distances, route.length > 0 ? route[route.length - 1] : (hasStartingPoint ? 0 : null), offset);
    
    // Añadir la ruta optimizada del cluster a la ruta global
    route = [...route, ...clusterRoute];
  }
  
  // Aplicar optimización 2-opt a toda la ruta para mejorar globalmente
  route = twoOptOptimization(route, distances, offset);
  
  // Construir la ruta final con todos los datos de los lugares
  const optimizedRoute = route.map((placeIndex, index) => ({
    ...places[placeIndex],
    order_index: index
  }));
  
  return optimizedRoute;
}

/**
 * Agrupa lugares por proximidad geográfica
 * @param {Array} places - Array de lugares
 * @returns {Array} Array de clusters (grupos de índices de lugares)
 */
function groupPlacesByProximity(places) {
  // Si hay pocos lugares, no hace falta clusterizar
  if (places.length <= 4) {
    return [places.map((_, i) => i)];
  }
  
  // Calcular matriz de distancias entre todos los lugares
  const n = places.length;
  const distMatrix = Array(n).fill().map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = calculateDistance(places[i].coordinates, places[j].coordinates);
      distMatrix[i][j] = dist;
      distMatrix[j][i] = dist;
    }
  }
  
  // Umbral de distancia para considerar lugares como "cercanos"
  // Usamos un percentil bajo de todas las distancias para determinar automáticamente
  let allDistances = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allDistances.push(distMatrix[i][j]);
    }
  }
  allDistances.sort((a, b) => a - b);
  
  // Usar el percentil 25 como umbral de proximidad
  const proximityThreshold = allDistances[Math.floor(allDistances.length * 0.25)];
  
  // Implementación simplificada de DBSCAN para clustering
  const visited = Array(n).fill(false);
  const clusters = [];
  
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    
    visited[i] = true;
    const cluster = [i];
    const neighbors = [];
    
    for (let j = 0; j < n; j++) {
      if (i !== j && distMatrix[i][j] <= proximityThreshold) {
        neighbors.push(j);
      }
    }
    
    while (neighbors.length > 0) {
      const current = neighbors.pop();
      if (visited[current]) continue;
      
      visited[current] = true;
      cluster.push(current);
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distMatrix[current][j] <= proximityThreshold) {
          neighbors.push(j);
        }
      }
    }
    
    // Añadir cluster solo si tiene al menos un elemento
    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }
  
  // Asignar lugares no agrupados al cluster más cercano
  for (let i = 0; i < n; i++) {
    let assigned = false;
    for (const cluster of clusters) {
      if (cluster.includes(i)) {
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      let minDistance = Infinity;
      let closestCluster = 0;
      
      for (let c = 0; c < clusters.length; c++) {
        const cluster = clusters[c];
        for (const placeIdx of cluster) {
          if (distMatrix[i][placeIdx] < minDistance) {
            minDistance = distMatrix[i][placeIdx];
            closestCluster = c;
          }
        }
      }
      
      clusters[closestCluster].push(i);
    }
  }
  
  // Asegurar que cada lugar está asignado a exactamente un cluster
  const allAssigned = new Set();
  for (const cluster of clusters) {
    for (const idx of cluster) {
      allAssigned.add(idx);
    }
  }
  
  // Si no se han asignado todos los lugares, crear un cluster con los faltantes
  if (allAssigned.size < n) {
    const missing = [];
    for (let i = 0; i < n; i++) {
      if (!allAssigned.has(i)) {
        missing.push(i);
      }
    }
    if (missing.length > 0) {
      clusters.push(missing);
    }
  }
  
  return clusters;
}

/**
 * Ordena clusters por proximidad
 * @param {Array} clusters - Array de clusters (grupos de índices)
 * @param {Array} distances - Matriz de distancias completa
 * @param {number|null} startIdx - Índice del punto de inicio, o null
 * @returns {Array} Clusters ordenados por proximidad
 */
function orderClustersByProximity(clusters, distances, startIdx) {
  if (clusters.length <= 1) return clusters;
  
  // Calcular "centroide" (promedio) de cada cluster
  const centroids = clusters.map(cluster => {
    const sum = cluster.reduce((acc, idx) => acc + idx, 0);
    return sum / cluster.length;
  });
  
  // Orden de los clusters
  const orderedClusters = [];
  const visited = Array(clusters.length).fill(false);
  
  // Índice del primer cluster (el más cercano al punto inicial si existe)
  let currentIdx;
  
  if (startIdx !== null) {
    // Comenzar con el cluster más cercano al punto inicial
    let minDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      for (const placeIdx of cluster) {
        const dist = distances[startIdx][placeIdx];
        if (dist < minDist) {
          minDist = dist;
          currentIdx = i;
        }
      }
    }
  } else {
    // Comenzar con cualquier cluster
    currentIdx = 0;
  }
  
  // Añadir el primer cluster
  visited[currentIdx] = true;
  orderedClusters.push(clusters[currentIdx]);
  
  // Ordenar el resto de clusters por proximidad
  while (orderedClusters.length < clusters.length) {
    let nextIdx = -1;
    let minDist = Infinity;
    
    // Último cluster añadido
    const lastCluster = orderedClusters[orderedClusters.length - 1];
    
    for (let i = 0; i < clusters.length; i++) {
      if (!visited[i]) {
        // Calcular distancia mínima entre cualquier lugar del último cluster y este
        for (const lastIdx of lastCluster) {
          for (const placeIdx of clusters[i]) {
            const dist = distances[lastIdx][placeIdx];
            if (dist < minDist) {
              minDist = dist;
              nextIdx = i;
            }
          }
        }
      }
    }
    
    if (nextIdx !== -1) {
      visited[nextIdx] = true;
      orderedClusters.push(clusters[nextIdx]);
    } else {
      // Si no se encuentra siguiente cluster, añadir cualquiera no visitado
      for (let i = 0; i < clusters.length; i++) {
        if (!visited[i]) {
          visited[i] = true;
          orderedClusters.push(clusters[i]);
          break;
        }
      }
    }
  }
  
  return orderedClusters;
}

/**
 * Optimiza la ruta dentro de un cluster
 * @param {Array} cluster - Array de índices de lugares en el cluster
 * @param {Array} distances - Matriz de distancias
 * @param {number|null} prevIdx - Índice del lugar previo, o null
 * @param {number} offset - Offset para ajustar índices
 * @returns {Array} Ruta optimizada dentro del cluster
 */
function optimizeCluster(cluster, distances, prevIdx, offset) {
  if (cluster.length <= 1) return cluster;
  
  // Usar algoritmo del vecino más cercano dentro del cluster
  const visited = Array(cluster.length).fill(false);
  const route = [];
  
  // Determinar el punto de inicio dentro del cluster (el más cercano al punto anterior)
  let startIdx = 0;
  if (prevIdx !== null) {
    let minDist = Infinity;
    for (let i = 0; i < cluster.length; i++) {
      const dist = distances[prevIdx][cluster[i]];
      if (dist < minDist) {
        minDist = dist;
        startIdx = i;
      }
    }
  }
  
  // Comenzar con el punto inicial
  let currentIdx = startIdx;
  visited[currentIdx] = true;
  route.push(cluster[currentIdx]);
  
  // Completar la ruta con el vecino más cercano
  while (route.length < cluster.length) {
    let nextIdx = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < cluster.length; i++) {
      if (!visited[i]) {
        const dist = distances[cluster[currentIdx]][cluster[i]];
        if (dist < minDist) {
          minDist = dist;
          nextIdx = i;
        }
      }
    }
    
    if (nextIdx !== -1) {
      visited[nextIdx] = true;
      route.push(cluster[nextIdx]);
      currentIdx = nextIdx;
    } else {
      break; // No debería ocurrir
    }
  }
  
  // Optimizar con 2-opt dentro del cluster
  if (route.length > 2) {
    // Ajustar para usar indices reales, no los del cluster
    const routeIndices = Array(route.length);
    for (let i = 0; i < route.length; i++) {
      routeIndices[i] = route[i];
    }
    
    // Aplicar 2-opt dentro del cluster
    let improved = true;
    let iterations = 0;
    const maxIterations = 50;
    
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      
      for (let i = 0; i < routeIndices.length - 2; i++) {
        for (let j = i + 2; j < routeIndices.length; j++) {
          const currDist = distances[routeIndices[i]][routeIndices[i+1]] + 
                          distances[routeIndices[j-1]][routeIndices[j]];
          
          const newDist = distances[routeIndices[i]][routeIndices[j-1]] + 
                         distances[routeIndices[i+1]][routeIndices[j]];
          
          if (newDist < currDist) {
            // Invertir segmento
            routeIndices.splice(i+1, j-i-1, ...routeIndices.slice(i+1, j).reverse());
            improved = true;
            break;
          }
        }
        
        if (improved) break;
      }
    }
    
    return routeIndices;
  }
  
  return route;
}

/**
 * Optimiza una ruta usando el algoritmo 2-opt
 * @param {Array} route - Array de índices que representa la ruta
 * @param {Array} distances - Matriz de distancias
 * @param {number} offset - Offset para ajustar índices si hay punto de inicio
 * @returns {Array} Ruta optimizada
 */
function twoOptOptimization(route, distances, offset) {
  let improved = true;
  let bestDistance = calculateRouteDistance(route, distances, offset);
  let iterations = 0;
  const maxIterations = 100; // Evitar bucles infinitos
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (let i = 0; i < route.length - 2; i++) {
      for (let j = i + 2; j < route.length; j++) {
        // No invertir si los extremos son el inicio y el final
        if (i === 0 && j === route.length - 1) continue;
        
        // Crear una nueva ruta invirtiendo el segmento entre i y j
        const newRoute = [...route];
        // Invertir segmento
        const segment = newRoute.slice(i + 1, j + 1).reverse();
        newRoute.splice(i + 1, j - i, ...segment);
        
        // Calcular la distancia de la nueva ruta
        const newDistance = calculateRouteDistance(newRoute, distances, offset);
        
        // Si la nueva ruta es mejor, reemplazar la actual
        if (newDistance < bestDistance) {
          route = newRoute;
          bestDistance = newDistance;
          improved = true;
          break; // Reiniciar el proceso con la nueva ruta
        }
      }
      if (improved) break;
    }
  }
  
  return route;
}

/**
 * Calcula la distancia total de una ruta
 * @param {Array} route - Array de índices que representa la ruta
 * @param {Array} distances - Matriz de distancias
 * @param {number} offset - Offset para ajustar índices si hay punto de inicio
 * @returns {number} Distancia total de la ruta
 */
function calculateRouteDistance(route, distances, offset) {
  let totalDistance = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i] + offset;
    const to = route[i + 1] + offset;
    totalDistance += distances[from][to];
  }
  
  return totalDistance;
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
  // Si solo hay un día, usa el algoritmo original
  if (days <= 1 || places.length <= days) {
    const optimizedRoute = findOptimalRoute(places, distances, startPoint, hotel);
    
    // Asignar día 1 y calcular tiempos
    const dayOfWeek = getDayOfWeek(0); // hoy
    let currentTime = timeToMinutes('09:00');
    let prevCoords = hotel ? hotel.coordinates : (startPoint || null);
    
    return optimizedRoute.map(place => {
      // Calcular tiempo de viaje
      let travelTime = 0;
      if (prevCoords) {
        const distance = calculateDistance(prevCoords, place.coordinates);
        travelTime = calculateTravelTime(distance) * 60;
      }
      
      // Ajustar por hora de apertura
      let arrivalTime = currentTime + travelTime;
      const availableTime = findFirstAvailableTime(place.openingHours, dayOfWeek, arrivalTime);
      
      // Si no hay hora disponible, usar 09:00 del día siguiente
      if (availableTime === null) {
        arrivalTime = timeToMinutes('09:00');
      } else {
        arrivalTime = availableTime;
      }
      
      const departureTime = arrivalTime + ((place.visitDuration || 1) * 60);
      
      // Actualizar para el siguiente lugar
      currentTime = departureTime;
      prevCoords = place.coordinates;
      
      return {
        ...place,
        day: 1,
        estimatedArrival: minutesToTime(arrivalTime),
        estimatedDeparture: minutesToTime(departureTime)
      };
    });
  }

  // Información del hotel
  const hotelCoordinates = hotel ? hotel.coordinates : null;
  
  // 1. OPTIMIZAR GLOBALMENTE TODOS LOS LUGARES POR PROXIMIDAD
  // Primero agrupamos lugares cercanos en clusters
  const clusters = groupPlacesByProximity(places);
  
  // Calculamos matriz de distancias entre lugares
  const locationsDistances = [];
  for (let i = 0; i < places.length; i++) {
    locationsDistances[i] = [];
    for (let j = 0; j < places.length; j++) {
      locationsDistances[i][j] = calculateDistance(places[i].coordinates, places[j].coordinates);
    }
  }
  
  // Ordenamos clusters por proximidad
  const orderedClusters = orderClustersByProximity(clusters, distances, hotelCoordinates ? 0 : null);
  
  // 2. CREAR UNA SECUENCIA INICIAL BASADA EN CLUSTERS
  let initialSequence = [];
  
  // Aplanar los clusters manteniendo juntos los lugares cercanos
  for (const cluster of orderedClusters) {
    // Optimizar el orden dentro de cada cluster
    const optimizedCluster = optimizeClusterOrder(cluster, locationsDistances, places);
    initialSequence = [...initialSequence, ...optimizedCluster];
  }
  
  // 3. AJUSTAR LA SECUENCIA PARA LUGARES ESENCIALES
  // Mover lugares esenciales hacia el principio manteniendo la coherencia geográfica
  const essentialPlaces = initialSequence.filter(idx => places[idx].isEssential);
  const nonEssentialPlaces = initialSequence.filter(idx => !places[idx].isEssential);
  
  // Si hay lugares esenciales, priorizarlos pero manteniendo su orden geográfico
  if (essentialPlaces.length > 0) {
    // Calcular cuántos lugares esenciales incluir cada día (distribución equitativa)
    const essentialPerDay = Math.ceil(essentialPlaces.length / days);
    
    // Redistribuir los lugares manteniendo esenciales al principio con coherencia geográfica
    initialSequence = distributeEssentialPlaces(essentialPlaces, nonEssentialPlaces, essentialPerDay, locationsDistances);
  }
  
  // 4. DISTRIBUIR EN DÍAS RESPETANDO LA SECUENCIA DE PROXIMIDAD
  const dayRoutes = [];
  let currentDay = 1;
  let currentDayMinutes = timeToMinutes('09:00');
  let currentDayPlaces = [];
  let dailyDuration = 0;
  
  // Información para calcular tiempos
  const dailyStartTime = timeToMinutes('09:00');
  const maxDayMinutes = maxHoursPerDay * 60;
  let previousCoords = hotelCoordinates || (startPoint ? startPoint : null);
  
  // Posponer lugares si tienen problemas de horario o no caben en el día
  const postponedPlaces = [];
  
  // Distribuir los lugares en días respetando la secuencia optimizada
  for (let i = 0; i < initialSequence.length; i++) {
    const placeIndex = initialSequence[i];
    const place = places[placeIndex];
    const visitDuration = (place.visitDuration || 1) * 60;
    const dayOfWeek = getDayOfWeek(currentDay - 1);
    
    // Calcular tiempo de viaje desde punto anterior
    let travelMinutes = 0;
    if (previousCoords) {
      const distance = calculateDistance(previousCoords, place.coordinates);
      travelMinutes = calculateTravelTime(distance) * 60;
    }
    
    // Calcular tiempo estimado de llegada
    let arrivalTime = currentDayMinutes + travelMinutes;
    
    // Ajustar por horarios de apertura
    const availableTime = findFirstAvailableTime(place.openingHours, dayOfWeek, arrivalTime);
    
    // Si no hay hora disponible este día
    if (availableTime === null) {
      if (place.isEssential) {
        // Si es esencial, pasar al siguiente día
        if (currentDayPlaces.length > 0) {
          // Reoptimizar el orden del día actual según proximidad
          const reoptimizedDay = reoptimizeDayByProximity(currentDayPlaces, locationsDistances);
          dayRoutes.push(reoptimizedDay);
        }
        
        // Configurar para nuevo día
        currentDay++;
        currentDayPlaces = [];
        currentDayMinutes = dailyStartTime;
        dailyDuration = 0;
        
        // Comprobar horario en el nuevo día
        const nextDayOfWeek = getDayOfWeek(currentDay - 1);
        const newAvailableTime = findFirstAvailableTime(place.openingHours, nextDayOfWeek, dailyStartTime);
        
        if (newAvailableTime !== null) {
          // Si está disponible el nuevo día, añadirlo
          arrivalTime = newAvailableTime;
          const departureTime = arrivalTime + visitDuration;
          
          currentDayPlaces.push({
            ...place,
            originalIndex: placeIndex,
            day: currentDay,
            order_index: 0,
            estimatedArrival: minutesToTime(arrivalTime),
            estimatedDeparture: minutesToTime(departureTime)
          });
          
          currentDayMinutes = departureTime;
          dailyDuration += visitDuration + travelMinutes;
          previousCoords = place.coordinates;
        } else {
          // Si sigue sin estar disponible, añadirlo con advertencia
          place.visitWarning = `Lugar posiblemente cerrado`;
          postponedPlaces.push(placeIndex);
        }
      } else {
        // Si no es esencial, posponer
        postponedPlaces.push(placeIndex);
      }
      
      continue;
    }
    
    // Actualizar tiempo con la primera hora disponible
    arrivalTime = availableTime;
    const departureTime = arrivalTime + visitDuration;
    
    // Comprobar si este lugar cabe en el día actual
    const additionalTime = visitDuration + travelMinutes;
    
    if (place.isEssential || dailyDuration + additionalTime <= maxDayMinutes) {
      // Añadir al día actual
      currentDayPlaces.push({
        ...place,
        originalIndex: placeIndex,
        day: currentDay,
        order_index: currentDayPlaces.length,
        estimatedArrival: minutesToTime(arrivalTime),
        estimatedDeparture: minutesToTime(departureTime)
      });
      
      currentDayMinutes = departureTime;
      dailyDuration += additionalTime;
      previousCoords = place.coordinates;
    } else {
      // Reoptimizar el orden del día actual según proximidad
      const reoptimizedDay = reoptimizeDayByProximity(currentDayPlaces, locationsDistances);
      dayRoutes.push(reoptimizedDay);
      
      // Configurar para nuevo día
      currentDay++;
      currentDayPlaces = [];
      currentDayMinutes = dailyStartTime;
      dailyDuration = 0;
      
      if (hotelCoordinates) {
        previousCoords = hotelCoordinates;
        const distanceFromHotel = calculateDistance(hotelCoordinates, place.coordinates);
        travelMinutes = calculateTravelTime(distanceFromHotel) * 60;
      } else {
        previousCoords = startPoint ? startPoint : null;
        travelMinutes = 0;
      }
      
      // Comprobar disponibilidad en el nuevo día
      const nextDayOfWeek = getDayOfWeek(currentDay - 1);
      const newAvailableTime = findFirstAvailableTime(place.openingHours, nextDayOfWeek, dailyStartTime + travelMinutes);
      
      if (newAvailableTime !== null) {
        // Añadir al nuevo día
        arrivalTime = newAvailableTime;
        const newDepartureTime = arrivalTime + visitDuration;
        
        currentDayPlaces.push({
          ...place,
          originalIndex: placeIndex,
          day: currentDay,
          order_index: 0,
          estimatedArrival: minutesToTime(arrivalTime),
          estimatedDeparture: minutesToTime(newDepartureTime)
        });
        
        currentDayMinutes = newDepartureTime;
        dailyDuration += visitDuration + travelMinutes;
        previousCoords = place.coordinates;
      } else {
        // Si no está disponible, posponer
        postponedPlaces.push(placeIndex);
      }
    }
  }
  
  // Añadir el último día si tiene lugares
  if (currentDayPlaces.length > 0) {
    // Reoptimizar el orden del último día según proximidad
    const reoptimizedDay = reoptimizeDayByProximity(currentDayPlaces, locationsDistances);
    dayRoutes.push(reoptimizedDay);
  }
  
  // 5. REDISTRIBUIR LUGARES POSPUESTOS
  if (postponedPlaces.length > 0) {
    // Ordenar días por carga de trabajo
    const dayLoads = dayRoutes.map((day, index) => ({
      dayIndex: index,
      load: day.reduce((sum, place) => sum + (place.visitDuration || 1), 0)
    }));
    
    dayLoads.sort((a, b) => a.load - b.load);
    
    // Intentar añadir lugares pospuestos
    for (const placeIndex of postponedPlaces) {
      const place = places[placeIndex];
      
      // Encontrar el día con menos carga que puede acomodar este lugar
      for (const dayLoad of dayLoads) {
        const dayIndex = dayLoad.dayIndex;
        const day = dayRoutes[dayIndex];
        const currentDayTotal = dayLoad.load;
        
        // Si cabe en este día, añadirlo
        if (currentDayTotal + (place.visitDuration || 1) <= maxHoursPerDay) {
          // Encontrar la mejor posición dentro del día (cerca del lugar más cercano)
          let bestPosition = 0;
          let minDistance = Infinity;
          
          for (let i = 0; i < day.length; i++) {
            const existingPlace = day[i];
            const distance = calculateDistance(place.coordinates, existingPlace.coordinates);
            
            if (distance < minDistance) {
              minDistance = distance;
              bestPosition = i;
            }
          }
          
          // Insertar en la posición óptima
          const newPlace = {
            ...place,
            originalIndex: placeIndex,
            day: dayIndex + 1,
            estimatedArrival: "09:00", // Tiempo aproximado, se recalculará después
            estimatedDeparture: "10:00"
          };
          
          // Insertar en la posición más cercana
          day.splice(bestPosition + 1, 0, newPlace);
          
          // Actualizar la carga del día
          dayLoad.load += (place.visitDuration || 1);
          
          // Reordenar la lista de cargas
          dayLoads.sort((a, b) => a.load - b.load);
          
          // Reoptimizar este día de nuevo
          dayRoutes[dayIndex] = reoptimizeDayByProximity(day, locationsDistances);
          break;
        }
      }
    }
  }
  
  // 6. AJUSTAR A LA CANTIDAD DE DÍAS DISPONIBLES
  if (dayRoutes.length > days) {
    // Fusionar días hasta tener el número correcto
    while (dayRoutes.length > days) {
      // Encontrar los dos días consecutivos con lugares más cercanos entre sí
      let minDistance = Infinity;
      let daysToMerge = [0, 1];
      
      for (let i = 0; i < dayRoutes.length - 1; i++) {
        for (let j = i + 1; j < dayRoutes.length; j++) {
          const day1 = dayRoutes[i];
          const day2 = dayRoutes[j];
          
          // Encontrar la distancia mínima entre cualquier par de lugares
          for (const place1 of day1) {
            for (const place2 of day2) {
              const distance = calculateDistance(place1.coordinates, place2.coordinates);
              if (distance < minDistance) {
                minDistance = distance;
                daysToMerge = [i, j];
              }
            }
          }
        }
      }
      
      // Fusionar los dos días más cercanos
      const [day1Index, day2Index] = daysToMerge;
      const mergedPlaces = [...dayRoutes[day1Index], ...dayRoutes[day2Index]];
      
      // Optimizar el orden del día fusionado
      const reoptimizedMerged = reoptimizeDayByProximity(mergedPlaces, locationsDistances);
      
      // Reemplazar el primer día con el fusionado y eliminar el segundo
      dayRoutes[day1Index] = reoptimizedMerged;
      dayRoutes.splice(day2Index, 1);
    }
  }
  
  // 7. RECALCULAR TIEMPOS Y CREAR RESULTADO FINAL
  const finalRoute = [];
  
  for (let dayIndex = 0; dayIndex < dayRoutes.length; dayIndex++) {
    const dayNumber = dayIndex + 1;
    const dayPlaces = dayRoutes[dayIndex];
    const dayOfWeek = getDayOfWeek(dayIndex);
    
    // Recalcular tiempos para este día
    let dayTime = dailyStartTime;
    let prevCoords = hotelCoordinates || (startPoint ? startPoint : null);
    
    for (let j = 0; j < dayPlaces.length; j++) {
      const place = dayPlaces[j];
      
      // Actualizar día y orden
      place.day = dayNumber;
      place.order_index = j;
      place.dayOfWeek = dayOfWeek;
      
      // Recalcular tiempo de llegada
      if (prevCoords) {
        const distance = calculateDistance(prevCoords, place.coordinates);
        const travelTime = calculateTravelTime(distance) * 60;
        dayTime += travelTime;
      }
      
      // Ajustar por horario de apertura
      const availableTime = findFirstAvailableTime(place.openingHours, dayOfWeek, dayTime);
      
      if (availableTime !== null) {
        dayTime = availableTime;
      }
      
      // Actualizar tiempos
      const visitDuration = (place.visitDuration || 1) * 60;
      place.estimatedArrival = minutesToTime(dayTime);
      place.estimatedDeparture = minutesToTime(dayTime + visitDuration);
      
      // Avanzar tiempo y actualizar coordenadas
      dayTime += visitDuration;
      prevCoords = place.coordinates;
      
      // Eliminar propiedades temporales
      delete place.originalIndex;
      
      // Añadir al resultado final
      finalRoute.push(place);
    }
  }
  
  // Ordenar por día y luego por order_index
  finalRoute.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.order_index - b.order_index;
  });
  
  return finalRoute;
}

/**
 * Optimiza el orden de los lugares dentro de un cluster
 * @param {Array} cluster - Cluster de índices de lugares 
 * @param {Array} distances - Matriz de distancias entre lugares
 * @param {Array} places - Lista completa de lugares
 * @returns {Array} - Cluster optimizado
 */
function optimizeClusterOrder(cluster, distances, places) {
  if (cluster.length <= 1) return cluster;
  
  // Ordenar el cluster por orden de "vecino más cercano"
  const visited = Array(cluster.length).fill(false);
  const orderedCluster = [];
  
  // Comenzar con cualquier lugar (preferiblemente esencial si hay)
  let startIdx = 0;
  for (let i = 0; i < cluster.length; i++) {
    if (places[cluster[i]].isEssential) {
      startIdx = i;
      break;
    }
  }
  
  let currentIdx = startIdx;
  visited[currentIdx] = true;
  orderedCluster.push(cluster[currentIdx]);
  
  // Completar la ruta con vecinos más cercanos
  while (orderedCluster.length < cluster.length) {
    let nextIdx = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < cluster.length; i++) {
      if (!visited[i]) {
        const dist = distances[cluster[currentIdx]][cluster[i]];
        if (dist < minDist) {
          minDist = dist;
          nextIdx = i;
        }
      }
    }
    
    if (nextIdx !== -1) {
      visited[nextIdx] = true;
      orderedCluster.push(cluster[nextIdx]);
      currentIdx = nextIdx;
    } else {
      break; // No debería ocurrir
    }
  }
  
  return orderedCluster;
}

/**
 * Distribuye lugares esenciales y no esenciales manteniendo coherencia geográfica
 * @param {Array} essentialPlaces - Lugares esenciales
 * @param {Array} nonEssentialPlaces - Lugares no esenciales
 * @param {number} essentialPerDay - Lugares esenciales por día
 * @param {Array} distances - Matriz de distancias
 * @returns {Array} - Secuencia optimizada
 */
function distributeEssentialPlaces(essentialPlaces, nonEssentialPlaces, essentialPerDay, distances) {
  if (essentialPlaces.length === 0) return nonEssentialPlaces;
  if (nonEssentialPlaces.length === 0) return essentialPlaces;
  
  // Comenzar con los lugares esenciales
  let result = [...essentialPlaces];
  
  // Para cada lugar no esencial, encontrar el lugar en la secuencia más cercano
  for (const nonEssentialIdx of nonEssentialPlaces) {
    let bestPosition = 0;
    let minDistance = Infinity;
    
    // Encontrar la mejor posición (después del lugar más cercano)
    for (let i = 0; i < result.length; i++) {
      const distance = distances[result[i]][nonEssentialIdx];
      if (distance < minDistance) {
        minDistance = distance;
        bestPosition = i + 1; // Insertar después del lugar cercano
      }
    }
    
    // Insertar en la mejor posición
    result.splice(bestPosition, 0, nonEssentialIdx);
  }
  
  return result;
}

/**
 * Reoptimiza el orden de los lugares en un día según proximidad
 * @param {Array} dayPlaces - Lugares asignados a un día
 * @param {Array} distances - Matriz de distancias
 * @returns {Array} - Lista reordenada de lugares
 */
function reoptimizeDayByProximity(dayPlaces, distances) {
  if (dayPlaces.length <= 1) return dayPlaces;
  
  // Extraer índices originales
  const indices = dayPlaces.map(place => place.originalIndex || 0);
  
  // Crear matriz de distancias para este subconjunto
  const n = indices.length;
  const subDistances = Array(n).fill().map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const pi = indices[i];
        const pj = indices[j];
        subDistances[i][j] = distances[pi][pj];
      }
    }
  }
  
  // Ordenar por vecino más cercano
  const visited = Array(n).fill(false);
  const orderedIndices = [];
  
  // Comenzar con el primer lugar
  let currentIdx = 0;
  visited[currentIdx] = true;
  orderedIndices.push(currentIdx);
  
  // Añadir el resto por proximidad
  while (orderedIndices.length < n) {
    let nextIdx = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        if (subDistances[currentIdx][i] < minDist) {
          minDist = subDistances[currentIdx][i];
          nextIdx = i;
        }
      }
    }
    
    if (nextIdx !== -1) {
      visited[nextIdx] = true;
      orderedIndices.push(nextIdx);
      currentIdx = nextIdx;
    } else {
      break;
    }
  }
  
  // Crear nueva lista ordenada
  const orderedDay = orderedIndices.map(idx => {
    const place = dayPlaces[idx];
    // Actualizar order_index
    return {
      ...place,
      order_index: orderedIndices.indexOf(idx)
    };
  });
  
  // Verificar lugares esenciales (no deberían quedar al final)
  const essentials = orderedDay.filter(p => p.isEssential);
  const nonEssentials = orderedDay.filter(p => !p.isEssential);
  
  if (essentials.length > 0 && nonEssentials.length > 0) {
    // Asegurar que al menos un lugar esencial esté al principio
    const hasEssentialFirst = orderedDay[0].isEssential;
    
    if (!hasEssentialFirst) {
      // Mover el primer esencial al principio
      const firstEssential = essentials[0];
      const currentIndex = orderedDay.indexOf(firstEssential);
      
      // Solo si no está demasiado lejos del principio
      if (currentIndex > 2) {
        orderedDay.splice(currentIndex, 1);
        orderedDay.unshift(firstEssential);
        
        // Reajustar índices
        orderedDay.forEach((p, idx) => {
          p.order_index = idx;
        });
      }
    }
  }
  
  return orderedDay;
}

module.exports = routeRoutes; 