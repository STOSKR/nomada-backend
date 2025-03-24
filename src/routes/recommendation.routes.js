/**
 * Rutas de recomendaciones de viaje
 * 
 * Maneja la generación de recomendaciones personalizadas para los usuarios
 */
const RecommendationService = require('../services/recommendation.service');

/**
 * Esquemas para validación y documentación
 */
const schemas = {
  // Esquema para obtener recomendaciones generales
  getRecommendations: {
    description: 'Obtener recomendaciones personalizadas de destinos',
    tags: ['recomendaciones'],
    security: [{ apiKey: [] }],
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 5 },
        region: { type: 'string' },
        travelStyle: { type: 'string', enum: ['adventure', 'relax', 'culture', 'gastronomy'] },
        budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] },
        duration: { type: 'integer', description: 'Duración del viaje en días' }
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
                placeId: { type: 'string' },
                name: { type: 'string' },
                country: { type: 'string' },
                description: { type: 'string' },
                matchScore: { type: 'number', description: 'Puntuación de coincidencia con preferencias' },
                imageUrl: { type: 'string' },
                highlights: {
                  type: 'array',
                  items: { type: 'string' }
                },
                travelTips: {
                  type: 'array',
                  items: { type: 'string' }
                },
                bestTimeToVisit: { type: 'string' },
                budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] },
                idealFor: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  // Esquema para obtener un plan personalizado para un destino específico
  getPersonalizedPlan: {
    description: 'Obtener un plan personalizado para un destino específico',
    tags: ['recomendaciones'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      required: ['placeId'],
      properties: {
        placeId: { type: 'string' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Duración de la visita en días', default: 3 },
        travelStyle: { type: 'string', enum: ['adventure', 'relax', 'culture', 'gastronomy'] },
        budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] }
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
              place: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  country: { type: 'string' },
                  description: { type: 'string' }
                }
              },
              itinerary: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'integer' },
                    activities: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          description: { type: 'string' },
                          type: { type: 'string' },
                          duration: { type: 'string' },
                          location: { type: 'string' },
                          cost: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              },
              accommodationOptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    priceRange: { type: 'string' },
                    location: { type: 'string' },
                    amenities: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              },
              transportationOptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    description: { type: 'string' },
                    cost: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  
  // Esquema para obtener sugerencias de destinos similares
  getSimilarDestinations: {
    description: 'Obtener destinos similares a uno específico',
    tags: ['recomendaciones'],
    params: {
      type: 'object',
      required: ['placeId'],
      properties: {
        placeId: { type: 'string' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 5 }
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
                placeId: { type: 'string' },
                name: { type: 'string' },
                country: { type: 'string' },
                description: { type: 'string' },
                similarityScore: { type: 'number' },
                imageUrl: { type: 'string' },
                similarTraits: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  // Esquema para generar una ruta de viaje óptima
  generateOptimalRoute: {
    description: 'Generar una ruta de viaje óptima entre destinos',
    tags: ['recomendaciones'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      required: ['destinations'],
      properties: {
        destinations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array de IDs de destinos'
        },
        startLocation: { type: 'string', description: 'ID del destino de inicio (opcional)' },
        endLocation: { type: 'string', description: 'ID del destino final (opcional)' },
        optimizationCriteria: { 
          type: 'string', 
          enum: ['distance', 'time', 'cost', 'balanced'],
          default: 'balanced'
        }
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
              route: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    order: { type: 'integer' },
                    placeId: { type: 'string' },
                    placeName: { type: 'string' },
                    country: { type: 'string' },
                    suggestedDays: { type: 'integer' }
                  }
                }
              },
              totalDistance: { type: 'number' },
              estimatedTravelTime: { type: 'number' },
              estimatedCost: { type: 'number' },
              transportationOptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fromPlace: { type: 'string' },
                    toPlace: { type: 'string' },
                    options: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          duration: { type: 'string' },
                          cost: { type: 'string' },
                          frequency: { type: 'string' }
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
    }
  }
};

/**
 * Plugin de Fastify para las rutas de recomendaciones
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function recommendationRoutes(fastify, options) {
  // Instancia del servicio de recomendaciones
  const recommendationService = new RecommendationService(fastify.supabase);
  
  // Obtener recomendaciones personalizadas
  fastify.get('/', {
    schema: schemas.getRecommendations,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { limit, region, travelStyle, budget, duration } = request.query;
      
      const recommendations = await recommendationService.getPersonalizedRecommendations(
        userId,
        { limit, region, travelStyle, budget, duration }
      );
      
      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: 'Error al obtener recomendaciones',
        error: error.message
      });
    }
  });

  // Obtener plan personalizado para un destino
  fastify.get('/plan/:placeId', {
    schema: schemas.getPersonalizedPlan,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { placeId } = request.params;
      const { days, travelStyle, budget } = request.query;
      
      const plan = await recommendationService.getPersonalizedPlan(
        userId,
        placeId,
        { days, travelStyle, budget }
      );
      
      return {
        success: true,
        data: plan
      };
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Place not found') {
        return reply.code(404).send({
          success: false,
          message: 'Destino no encontrado'
        });
      }
      
      return reply.code(500).send({
        success: false,
        message: 'Error al generar el plan personalizado',
        error: error.message
      });
    }
  });

  // Obtener destinos similares
  fastify.get('/similar/:placeId', {
    schema: schemas.getSimilarDestinations
  }, async (request, reply) => {
    try {
      const { placeId } = request.params;
      const { limit } = request.query;
      
      const similarDestinations = await recommendationService.getSimilarDestinations(placeId, limit);
      
      return {
        success: true,
        data: similarDestinations
      };
    } catch (error) {
      request.log.error(error);
      
      if (error.message === 'Place not found') {
        return reply.code(404).send({
          success: false,
          message: 'Destino no encontrado'
        });
      }
      
      return reply.code(500).send({
        success: false,
        message: 'Error al buscar destinos similares',
        error: error.message
      });
    }
  });

  // Generar ruta óptima
  fastify.post('/optimal-route', {
    schema: schemas.generateOptimalRoute,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { 
        destinations, 
        startLocation, 
        endLocation, 
        optimizationCriteria 
      } = request.body;
      
      if (!destinations || destinations.length < 2) {
        return reply.code(400).send({
          success: false,
          message: 'Se requieren al menos dos destinos para generar una ruta'
        });
      }
      
      const optimalRoute = await recommendationService.generateOptimalRoute(
        destinations,
        { startLocation, endLocation, optimizationCriteria }
      );
      
      return {
        success: true,
        data: optimalRoute
      };
    } catch (error) {
      request.log.error(error);
      
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          message: error.message
        });
      }
      
      return reply.code(500).send({
        success: false,
        message: 'Error al generar la ruta óptima',
        error: error.message
      });
    }
  });
}

module.exports = recommendationRoutes; 