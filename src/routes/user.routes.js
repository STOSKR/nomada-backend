const UserService = require('../services/user.service');
const FollowService = require('../services/follow.service');
const { supabase } = require('../db/supabase');

// Esquemas para validación y documentación
const schemas = {

  getProfile: {
    description: 'Obtener perfil del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nomada_id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              bio: { type: 'string' },
              preferences: {
                type: 'object',
                properties: {
                  favoriteDestinations: { type: 'array', items: { type: 'string' } },
                  travelStyle: { type: 'string', enum: ['adventure', 'relax', 'culture', 'gastronomy'] },
                  budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] }
                }
              },
              visitedCountries: { type: 'array', items: { type: 'string' } },
              followersCount: { type: 'number' },
              followingCount: { type: 'number' },
              routesCount: { type: 'number' }
            }
          }
        }
      }
    }
  },

  updateProfile: {
    description: 'Actualizar perfil del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Nombre visible del usuario' },
        nomada_id: { type: 'string', minLength: 3, description: 'ID único del nómada (debe ser único)' },
        bio: { type: 'string', description: 'Biografía del usuario' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nomada_id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              bio: { type: 'string' },
              preferences: { type: 'object' },
              visitedCountries: { type: 'array', items: { type: 'string' } },
              followersCount: { type: 'number' },
              followingCount: { type: 'number' },
              routesCount: { type: 'number' }
            }
          }
        }
      }
    }
  },

  updatePreferences: {
    description: 'Actualizar preferencias de viaje del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      properties: {
        preferences: {
          type: 'object',
          properties: {
            favoriteDestinations: { type: 'array', items: { type: 'string' } },
            travelStyle: { type: 'string', enum: ['adventure', 'relax', 'culture', 'gastronomy'] },
            budget: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] }
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

  addVisitedCountry: {
    description: 'Añadir país visitado al perfil del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    body: {
      type: 'object',
      required: ['countryCode'],
      properties: {
        countryCode: { type: 'string', minLength: 2, maxLength: 2 },
        visitDate: { type: 'string', format: 'date' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          visitedCountries: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },

  followUser: {
    description: 'Seguir a un usuario',
    tags: ['usuarios', 'seguimiento'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' }
      },
      required: ['id']
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      }
    }
  },

  unfollowUser: {
    description: 'Dejar de seguir a un usuario',
    tags: ['usuarios', 'seguimiento'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' }
      },
      required: ['id']
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

  getFollowers: {
    description: 'Obtener seguidores de un usuario',
    tags: ['usuarios', 'seguimiento'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
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
            full_name: { type: 'string' },
            bio: { type: 'string' }
          }
        }
      }
    }
  },

  getFollowing: {
    description: 'Obtener usuarios seguidos por un usuario',
    tags: ['usuarios', 'seguimiento'],
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
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
            full_name: { type: 'string' },
            bio: { type: 'string' }
          }
        }
      }
    }
  },

  // Schema para obtener perfil de usuario por ID
  getUserById: {
    description: 'Obtener perfil de un usuario por ID',
    tags: ['usuarios'],
    hide: true,
    security: [{ apiKey: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nomada_id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              bio: { type: 'string' },
              preferences: { type: 'object' },
              visitedCountries: { type: 'array', items: { type: 'string' } },
              followersCount: { type: 'number' },
              followingCount: { type: 'number' },
              routesCount: { type: 'number' },
              isFollowing: { type: ['boolean', 'null'] }
            }
          }
        }
      }
    }
  }
};

/**
 * Plugin de Fastify para las rutas de usuario
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function userRoutes(fastify, options) {
  // Usar el cliente Supabase importado como respaldo si el decorador no está disponible
  const supabaseClient = fastify.supabase || supabase;

  if (!supabaseClient) {
    fastify.log.error('Error: Cliente de Supabase no disponible');
    throw new Error('Cliente de Supabase no disponible en rutas de usuario');
  }

  // Instancia del servicio de usuarios
  const userService = new UserService(supabaseClient);

  // Instancia del servicio de seguimiento
  const followService = new FollowService(supabaseClient);

  // Registro de usuario
  fastify.post('/register', { schema: schemas.register }, async (request, reply) => {
    try {
      const result = await userService.registerUser(request.body);
      return reply.code(201).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener perfil (autenticado)
  fastify.get('/profile', {
    schema: schemas.getProfile,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const result = await userService.getUserProfile(userId, userId);
      return {
        success: true,
        user: result
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(404).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener perfil de usuario por ID
  fastify.get('/:id', {
    schema: schemas.getUserById,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const requestedId = request.params.id;
      const currentUserId = request.user.id;

      // Si el ID es "me", devuelve el perfil del usuario actual
      if (requestedId === "me") {
        const result = await userService.getUserProfile(currentUserId, currentUserId);
        return {
          success: true,
          user: result
        };
      }

      // Verificar si es un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(requestedId);

      let result;

      if (isUuid) {
        // Si es un UUID, buscar por ID
        result = await userService.getUserProfile(requestedId, currentUserId);
      } else {
        // Si no es un UUID, buscar por username o nomada_id
        result = await userService.getUserByUsername(requestedId, currentUserId);
      }

      return {
        success: true,
        user: result
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(404).send({
        success: false,
        message: error.message
      });
    }
  });

  // Actualizar preferencias (autenticado)
  fastify.put('/preferences', {
    schema: schemas.updatePreferences,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { preferences } = request.body;
      await userService.updatePreferences(userId, preferences);
      return {
        success: true,
        message: 'Preferencias actualizadas correctamente'
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Añadir país visitado (autenticado)
  fastify.post('/visited-countries', {
    schema: schemas.addVisitedCountry,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { countryCode, visitDate } = request.body;
      const result = await userService.addVisitedCountry(userId, countryCode, visitDate);
      return {
        success: true,
        message: 'País visitado añadido correctamente',
        visitedCountries: result.visitedCountries
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Seguir a un usuario
  fastify.post('/:id/follow', {
    schema: schemas.followUser,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const currentUserId = request.user.id;
      const targetUserId = request.params.id;

      const result = await followService.followUser(currentUserId, targetUserId);

      return reply.code(201).send({
        success: true,
        message: result.message
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Dejar de seguir a un usuario
  fastify.delete('/:id/follow', {
    schema: schemas.unfollowUser,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const currentUserId = request.user.id;
      const targetUserId = request.params.id;

      const result = await followService.unfollowUser(currentUserId, targetUserId);

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener seguidores de un usuario
  fastify.get('/:id/followers', {
    schema: schemas.getFollowers,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.params.id === "me" ? request.user.id : request.params.id;
      const { limit = 20, offset = 0 } = request.query;

      const followers = await followService.getFollowers(userId, limit, offset);

      return followers;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Obtener usuarios seguidos por un usuario
  fastify.get('/:id/following', {
    schema: schemas.getFollowing,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.params.id === "me" ? request.user.id : request.params.id;
      const { limit = 20, offset = 0 } = request.query;

      const following = await followService.getFollowing(userId, limit, offset);

      return following;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Actualizar perfil de usuario
  fastify.put('/profile', {
    schema: schemas.updateProfile,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const userData = request.body;

      const updatedUser = await userService.updateUserProfile(userId, userData);

      return {
        success: true,
        message: 'Perfil actualizado correctamente',
        user: updatedUser
      };
    } catch (error) {
      request.log.error(error);

      if (error.message.includes('ya está en uso')) {
        return reply.code(409).send({
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
}

module.exports = userRoutes; 