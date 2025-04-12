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
              avatar_url: { type: 'string', description: 'URL del avatar del usuario' },
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
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Nombre visible del usuario' },
        nomada_id: { type: 'string', minLength: 3, description: 'ID único del nómada (debe ser único)' },
        bio: { type: 'string', description: 'Biografía del usuario' },
        avatar: { type: 'string', format: 'binary', description: 'Archivo de imagen para el avatar del usuario' }
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
          id: { type: 'string' },
          title: { type: 'string' },
          nomada_id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string' },
          bio: { type: 'string' },
          avatar_url: { type: 'string', description: 'URL del avatar del usuario' },
          preferences: { type: 'object' },
          visitedCountries: { type: 'array', items: { type: 'string' } },
          followersCount: { type: 'number' },
          followingCount: { type: 'number' },
          routesCount: { type: 'number' },
          isFollowing: { type: ['boolean', 'null'] },
          routes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                is_public: { type: 'boolean' },
                likes_count: { type: 'integer' },
                saved_count: { type: 'integer' },
                comments_count: { type: 'integer' },
                cover_image: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
                user_id: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },

  // Schema para subir avatar
  uploadAvatar: {
    description: 'Subir avatar del usuario',
    tags: ['usuarios'],
    security: [{ apiKey: [] }],
    consumes: ['multipart/form-data'],
    params: {
      type: 'object',
      properties: {
        nomada_id: { type: 'string' }
      },
      required: ['nomada_id']
    },
    body: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Archivo de imagen para el avatar del usuario' }
      },
      required: ['avatar']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          avatar_url: { type: 'string', description: 'URL del avatar del usuario' }
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
    schema: {
      description: 'Obtener perfil del usuario autenticado',
      tags: ['usuarios', 'perfil'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nomada_id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            bio: { type: 'string' },
            avatar_url: { type: 'string' },
            preferences: { type: 'object' },
            visitedCountries: { type: 'array', items: { type: 'string' } },
            followersCount: { type: 'integer' },
            followingCount: { type: 'integer' },
            routesCount: { type: 'integer' },
            isFollowing: { type: ['boolean', 'null'] },
            routes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  is_public: { type: 'boolean' },
                  likes_count: { type: 'integer' },
                  saved_count: { type: 'integer' },
                  comments_count: { type: 'integer' },
                  cover_image: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                  user_id: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preValidation: [fastify.authenticate]
  }, async function (request, reply) {
    try {
      const userId = request.user.id;

      const userService = new UserService(this.supabase);
      const profile = await userService.getUserProfile(userId, userId);

      // Devolver directamente el perfil sin envolverlo
      return reply.code(200).send(profile);
    } catch (error) {
      request.log.error('Error al obtener perfil:', error);
      return reply.code(400).send({
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
        // Devolver directamente el perfil sin envolverlo
        return reply.code(200).send(result);
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

      // Devolver directamente el perfil sin envolverlo
      return reply.code(200).send(result);
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
      const data = request.body;
      let avatarUrl = null;

      // Si se subió un archivo de avatar
      if (request.isMultipart()) {
        const file = await request.file();
        const buffer = await file.toBuffer();
        const filename = `${userId}-${Date.now()}.${file.filename.split('.').pop()}`;

        // Subir el archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await fastify.supabase.storage
          .from('avatars')
          .upload(filename, buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obtener la URL pública del archivo
        const { data: { publicUrl } } = fastify.supabase.storage
          .from('avatars')
          .getPublicUrl(filename);

        avatarUrl = publicUrl;
      }

      const updatedUser = await userService.updateUserProfile(userId, { ...data, avatar_url: avatarUrl });

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

  // Subir avatar para un usuario
  fastify.post('/:nomada_id/avatar', {
    schema: schemas.uploadAvatar,
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Verificar si el usuario actual tiene permiso para subir el avatar
      const currentUserId = request.user.id;
      const nomadaId = request.params.nomada_id;

      // Obtener el ID del usuario por su nomada_id
      const { data: userData, error: userError } = await fastify.supabase
        .from('users')
        .select('id')
        .eq('nomada_id', nomadaId)
        .single();

      if (userError || !userData) {
        return reply.code(404).send({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar que el usuario actual es el mismo que el usuario del avatar
      if (currentUserId !== userData.id) {
        return reply.code(403).send({
          success: false,
          message: 'No tienes permiso para actualizar el avatar de este usuario'
        });
      }

      let avatarUrl = null;

      // Procesar el archivo de avatar
      if (request.isMultipart()) {
        const file = await request.file();
        const buffer = await file.toBuffer();
        const filename = `${nomadaId}-${Date.now()}.${file.filename.split('.').pop()}`;

        // Subir el archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await fastify.supabase.storage
          .from('avatars')
          .upload(filename, buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obtener la URL pública del archivo
        const { data: { publicUrl } } = fastify.supabase.storage
          .from('avatars')
          .getPublicUrl(filename);

        avatarUrl = publicUrl;

        // Actualizar el avatar_url en el perfil del usuario
        const { error: updateError } = await fastify.supabase
          .from('users')
          .update({ avatar_url: avatarUrl })
          .eq('id', userData.id);

        if (updateError) throw updateError;

        return {
          success: true,
          message: 'Avatar actualizado correctamente',
          avatar_url: avatarUrl
        };
      } else {
        return reply.code(400).send({
          success: false,
          message: 'No se ha proporcionado un archivo de avatar'
        });
      }
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: error.message
      });
    }
  });
}

module.exports = userRoutes; 