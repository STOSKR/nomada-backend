const AuthService = require('../services/auth.service');

// Configuración de seguridad para Swagger
const securitySchemes = {
    apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Token JWT para autenticación'
    }
};

// Esquemas para validación y documentación
const schemas = {
    signup: {
        description: 'Registrar un nuevo usuario',
        tags: ['autenticación'],
        consumes: ['multipart/form-data'],
        body: {
            type: 'object',
            required: ['email', 'password', 'nomada_id'],
            properties: {
                email: { type: 'string', format: 'email', description: 'Correo electrónico (requerido)' },
                password: { type: 'string', minLength: 8, description: 'Contraseña (requerido, mínimo 8 caracteres)' },
                nomada_id: { type: 'string', minLength: 3, description: 'Identificador único de usuario (requerido, mínimo 3 caracteres)' },
                username: { type: 'string', description: 'Nombre visible del usuario' },
                bio: { type: 'string', description: 'Biografía del usuario' },
                avatar: { type: 'string', format: 'binary', description: 'Archivo de imagen para el avatar del usuario' }
            }
        },
        response: {
            201: {
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
                            avatar_url: { type: 'string', description: 'URL del avatar del usuario' }
                        }
                    },
                    token: { type: 'string' }
                }
            }
        }
    },

    login: {
        description: 'Iniciar sesión de usuario',
        tags: ['autenticación'],
        body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: { type: 'string', format: 'email', description: 'Correo electrónico (requerido)' },
                password: { type: 'string', description: 'Contraseña (requerido)' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
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
                            routesCount: { type: 'number' },
                            isFollowing: { type: ['boolean', 'null'] }
                        }
                    }
                }
            }
        }
    },

    logout: {
        description: 'Cerrar sesión de usuario',
        tags: ['autenticación'],
        security: [{ apiKey: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            },
            401: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    },

    verify: {
        description: 'Verificar token de usuario',
        tags: ['autenticación'],
        security: [{ apiKey: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    valid: { type: 'boolean' },
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            nomada_id: { type: 'string' },
                            username: { type: 'string' },
                            email: { type: 'string' },
                            avatar_url: { type: 'string', description: 'URL del avatar del usuario' }
                        }
                    }
                }
            }
        }
    },

    resetPassword: {
        description: 'Solicitar restablecimiento de contraseña',
        tags: ['autenticación'],
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email', description: 'Correo electrónico (requerido)' }
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
    }
};

/**
 * Plugin de Fastify para las rutas de autenticación
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function authRoutes(fastify, options) {
    // Instancia del servicio de autenticación
    const authService = new AuthService(fastify.supabase);

    // Ruta para registro de nuevo usuario
    fastify.post('/signup', { schema: schemas.signup }, async (request, reply) => {
        try {
            const data = request.body;
            let avatarUrl = null;

            // Si se subió un archivo de avatar
            if (request.isMultipart()) {
                const file = await request.file();
                const buffer = await file.toBuffer();
                const filename = `${data.nomada_id}-${Date.now()}.${file.filename.split('.').pop()}`;

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

            const result = await authService.signup({ ...data, avatar_url: avatarUrl });

            // Generar token JWT
            const token = fastify.jwt.sign({
                id: result.user.id,
                email: result.user.email
            });

            return reply.code(201).send({
                success: true,
                message: result.message,
                user: result.user,
                token
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para inicio de sesión
    fastify.post('/login', { schema: schemas.login }, async (request, reply) => {
        try {
            const { email, password } = request.body;
            const result = await authService.login(email, password);

            // Generar token JWT
            const token = fastify.jwt.sign({
                id: result.user.id,
                email: result.user.email
            });

            // Obtener perfil completo del usuario desde el servicio de usuarios
            const userService = new (require('../services/user.service'))(fastify.supabase);
            const profileData = await userService.getUserProfile(result.user.id, result.user.id);

            return {
                success: true,
                token,
                user: profileData
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(401).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para cerrar sesión
    fastify.post('/logout', {
        schema: schemas.logout,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const result = await authService.logout();

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para solicitar restablecimiento de contraseña
    fastify.post('/reset-password', { schema: schemas.resetPassword }, async (request, reply) => {
        try {
            const { email } = request.body;
            const result = await authService.resetPassword(email);
            return result;
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = authRoutes; 