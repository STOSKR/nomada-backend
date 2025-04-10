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
              priority: { type: 'integer', description: 'Prioridad del lugar (1-10)', minimum: 1, maximum: 10 }
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
      const { places, startPoint, days = 1, maxHoursPerDay = 8 } = request.body;
      
      if (!places || places.length < 2) {
        return reply.code(400).send({
          success: false,
          message: 'Se requieren al menos 2 lugares para optimizar una ruta'
        });
      }
      
      // Calcular distancias entre todos los puntos
      const distances = calculateDistanceMatrix(places, startPoint);
      
      // Aplicar algoritmo del vecino más cercano para encontrar la ruta óptima
      let optimizedRoute;
      
      if (days > 1) {
        // Si se especifican días, usar la versión del algoritmo con distribución por días
        optimizedRoute = findOptimalRouteWithDays(places, distances, startPoint, days, maxHoursPerDay);
      } else {
        // Usar el algoritmo original para un solo día
        optimizedRoute = findOptimalRoute(places, distances, startPoint);
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
 * @returns {Array} Matriz de distancias
 */
function calculateDistanceMatrix(places, startPoint = null) {
  const points = startPoint ? [startPoint, ...places] : places;
  const n = points.length;
  const distances = Array(n).fill().map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distances[i][j] = calculateDistance(
          points[i].coordinates || points[i],
          points[j].coordinates || points[j]
        );
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
 * Convierte una hora en formato HH:MM a minutos desde medianoche
 * @param {string} timeStr - Hora en formato HH:MM
 * @returns {number} Minutos desde medianoche
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a formato HH:MM
 * @param {number} minutes - Minutos desde medianoche
 * @returns {string} Hora en formato HH:MM
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Encuentra la ruta óptima usando una combinación de vecino más cercano y optimización 2-opt
 * @param {Array} places - Array de lugares
 * @param {Array} distances - Matriz de distancias
 * @param {Object} startPoint - Punto de inicio opcional
 * @returns {Array} Ruta optimizada con índices de orden
 */
function findOptimalRoute(places, distances, startPoint = null) {
  // 1. Generar ruta inicial con el algoritmo del vecino más cercano
  const n = places.length;
  const visited = Array(n + 1).fill(false);
  let route = [];
  
  // Índice de inicio (0 si hay startPoint, cualquier punto si no hay)
  let currentIndex = startPoint ? 0 : Math.floor(Math.random() * n);
  visited[currentIndex] = true;
  
  // Ajustar índice si empezamos desde un punto de inicio personalizado
  const offset = startPoint ? 1 : 0;
  
  // Para cada lugar, encontrar el vecino más cercano no visitado
  for (let i = 0; i < n; i++) {
    let nextIndex = -1;
    let minDistance = Infinity;
    
    // Considerar la prioridad del lugar como factor adicional
    for (let j = offset; j < n + offset; j++) {
      if (!visited[j]) {
        const placeIndex = startPoint ? j - 1 : j;
        const place = places[placeIndex];
        const priority = place.priority || 5; // Prioridad por defecto: 5
        
        // Factor de prioridad: distancias más cortas y prioridades más altas son preferidas
        // Multiplicamos por un factor inverso a la prioridad (10 - priority + 1) para que mayor prioridad reduzca la distancia efectiva
        const priorityFactor = 11 - priority; // 10 -> 1, 1 -> 10
        const effectiveDistance = distances[currentIndex][j] * priorityFactor / 10;
        
        if (effectiveDistance < minDistance) {
          minDistance = effectiveDistance;
          nextIndex = j;
        }
      }
    }
    
    // Si es el primer punto y hay startPoint, agregar el lugar real
    if (i === 0 && startPoint) {
      nextIndex = 1; // El primer lugar real está en el índice 1
    }
    
    // Si encontramos un vecino, añadirlo a la ruta
    if (nextIndex !== -1) {
      // Ajustar el índice para obtener el lugar correcto del array original
      const placeIndex = startPoint ? nextIndex - 1 : nextIndex;
      
      if (placeIndex >= 0 && placeIndex < places.length) {
        route.push(placeIndex); // Guardamos los índices para optimización 2-opt
        currentIndex = nextIndex;
        visited[nextIndex] = true;
      }
    }
  }
  
  // 2. Aplicar optimización 2-opt para mejorar la ruta
  route = twoOptOptimization(route, distances, offset);
  
  // 3. Construir la ruta final con todos los datos de los lugares
  const optimizedRoute = route.map((placeIndex, index) => ({
    ...places[placeIndex],
    order_index: index
  }));
  
  return optimizedRoute;
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
 * @param {number} days - Número de días para distribuir la ruta
 * @param {number} maxHoursPerDay - Horas máximas de actividad por día
 * @returns {Array} Ruta optimizada con índices de orden y asignación de días
 */
function findOptimalRouteWithDays(places, distances, startPoint = null, days = 1, maxHoursPerDay = 8) {
  // Primero encontramos la ruta óptima sin considerar los días
  const optimizedRoute = findOptimalRoute(places, distances, startPoint);
  
  // Si solo hay un día o no hay suficientes lugares, devolver la ruta sin cambios
  if (days <= 1 || optimizedRoute.length <= days) {
    return optimizedRoute.map(place => ({
      ...place,
      day: 1,
      estimatedArrival: '09:00',
      estimatedDeparture: minutesToTime(timeToMinutes('09:00') + ((place.visitDuration || 1) * 60))
    }));
  }
  
  // Distribuir los lugares en días considerando horarios de apertura
  const routeWithDays = [];
  let currentDay = 1;
  let currentDayMinutes = timeToMinutes('09:00'); // Comenzar a las 9 AM
  let previousPlace = null;
  const dailyStartTime = timeToMinutes('09:00'); // 9 AM
  const maxDayMinutes = dailyStartTime + (maxHoursPerDay * 60); // Convertir horas a minutos
  
  // Recorrer la ruta optimizada y asignar días
  for (let i = 0; i < optimizedRoute.length; i++) {
    const place = optimizedRoute[i];
    const visitDuration = place.visitDuration || 1; // Default 1 hora si no se especifica
    const visitDurationMinutes = visitDuration * 60;
    
    // Validar horarios de apertura y cierre
    let openingMinutes = null;
    let closingMinutes = null;
    
    if (place.openingHours) {
      openingMinutes = timeToMinutes(place.openingHours.open);
      closingMinutes = timeToMinutes(place.openingHours.close);
    }
    
    // Calcular tiempo de llegada estimado
    let arrivalMinutes = currentDayMinutes;
    
    // Calcular distancia y tiempo de viaje desde el lugar anterior
    if (previousPlace) {
      const distanceToPlace = calculateDistance(
        previousPlace.coordinates,
        place.coordinates
      );
      
      // Convertir distancia a tiempo aproximado (minutos)
      const travelMinutes = calculateTravelTime(distanceToPlace) * 60;
      arrivalMinutes += travelMinutes;
    }
    
    // Comprobar si el lugar estará cerrado a la llegada
    if (openingMinutes !== null && closingMinutes !== null) {
      // Si llegaríamos después del cierre, pasar al día siguiente
      if (arrivalMinutes >= closingMinutes && currentDay < days) {
        currentDay++;
        arrivalMinutes = dailyStartTime;
        
        // Si la hora de apertura es posterior a la hora de inicio del día, esperar
        if (openingMinutes > dailyStartTime) {
          arrivalMinutes = openingMinutes;
        }
      } 
      // Si llegamos antes de la apertura, esperar hasta que abra
      else if (arrivalMinutes < openingMinutes) {
        arrivalMinutes = openingMinutes;
      }
    }
    
    // Calcular la hora de salida estimada
    const departureMinutes = arrivalMinutes + visitDurationMinutes;
    
    // Si excedemos el tiempo máximo del día, pasar al siguiente (si hay días disponibles)
    if (departureMinutes > maxDayMinutes && i > 0 && currentDay < days) {
      currentDay++;
      // Reiniciar al siguiente día comenzando con este lugar
      arrivalMinutes = dailyStartTime;
      
      // Verificar horario de apertura para el nuevo día
      if (openingMinutes !== null && openingMinutes > dailyStartTime) {
        arrivalMinutes = openingMinutes;
      }
    }
    
    // Añadir el lugar con su día y horarios asignados
    routeWithDays.push({
      ...place,
      day: currentDay,
      estimatedArrival: minutesToTime(arrivalMinutes),
      estimatedDeparture: minutesToTime(arrivalMinutes + visitDurationMinutes)
    });
    
    // Actualizar la hora actual del día para el siguiente lugar
    currentDayMinutes = arrivalMinutes + visitDurationMinutes;
    previousPlace = place;
  }
  
  // Optimizar la ruta para cada día individualmente usando 2-opt
  const routeByDay = routeWithDays.reduce((acc, place) => {
    if (!acc[place.day]) {
      acc[place.day] = [];
    }
    acc[place.day].push(place);
    return acc;
  }, {});
  
  // Para cada día, reoptimizar el orden basado en proximidad geográfica
  const finalRoute = [];
  
  for (let day = 1; day <= days; day++) {
    if (!routeByDay[day] || routeByDay[day].length <= 2) {
      // Si hay 2 o menos lugares, mantener el orden original
      if (routeByDay[day]) {
        routeByDay[day].forEach((place, index) => {
          finalRoute.push({
            ...place,
            order_index: index
          });
        });
      }
      continue;
    }
    
    // Crear matriz de distancias para este día
    const dayPlaces = routeByDay[day];
    const n = dayPlaces.length;
    const dayDistances = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          dayDistances[i][j] = calculateDistance(
            dayPlaces[i].coordinates,
            dayPlaces[j].coordinates
          );
        }
      }
    }
    
    // Encontrar la mejor ruta para este día usando 2-opt
    const dayIndices = Array.from({ length: n }, (_, i) => i);
    const optimizedDayIndices = twoOptOptimization(dayIndices, dayDistances, 0);
    
    // Recalcular horarios para la nueva secuencia
    let currentTime = timeToMinutes('09:00');
    
    // Agregar los lugares optimizados al resultado final
    optimizedDayIndices.forEach((placeIndex, index) => {
      const place = dayPlaces[placeIndex];
      
      // Calcular tiempo de llegada y salida desde el lugar anterior
      if (index > 0) {
        const prevPlace = dayPlaces[optimizedDayIndices[index - 1]];
        const distance = calculateDistance(
          prevPlace.coordinates,
          place.coordinates
        );
        const travelMinutes = calculateTravelTime(distance) * 60;
        currentTime += travelMinutes;
      }
      
      // Ajustar por horarios de apertura
      if (place.openingHours) {
        const openingTime = timeToMinutes(place.openingHours.open);
        if (openingTime > currentTime) {
          currentTime = openingTime;
        }
      }
      
      const visitDuration = (place.visitDuration || 1) * 60;
      
      finalRoute.push({
        ...place,
        order_index: index,
        estimatedArrival: minutesToTime(currentTime),
        estimatedDeparture: minutesToTime(currentTime + visitDuration)
      });
      
      currentTime += visitDuration;
    });
  }
  
  // Ordenar por día y luego por order_index
  finalRoute.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.order_index - b.order_index;
  });
  
  return finalRoute;
}

module.exports = routeRoutes; 