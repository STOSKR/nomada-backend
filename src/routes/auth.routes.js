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
        consumes: ['application/json'],
        body: {
            type: 'object',
            required: ['email', 'password', 'nomada_id'],
            additionalProperties: true,
            properties: {
                email: { type: 'string', format: 'email', description: 'Correo electrónico (requerido)' },
                password: { type: 'string', minLength: 8, description: 'Contraseña (requerido, mínimo 8 caracteres)' },
                nomada_id: { type: 'string', minLength: 3, description: 'Identificador único de usuario (requerido, mínimo 3 caracteres)' },
                username: { type: 'string', description: 'Nombre visible del usuario' },
                bio: { type: 'string', description: 'Biografía del usuario' }
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

    googleCallback: {
        description: 'Autenticación unificada con Google a través de Supabase',
        tags: ['autenticación'],
        body: {
            type: 'object',
            required: ['supabaseToken'],
            properties: {
                supabaseToken: { type: 'string', description: 'Token de Supabase obtenido después de la autenticación con Google' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    token: { type: 'string' },
                    nomada: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            nombre: { type: 'string' },
                            nomada_id: { type: 'string' },
                            foto_perfil: { type: 'string' },
                            ubicacion_actual: { type: 'string' },
                            verificado: { type: 'boolean' },
                            created_at: { type: 'string' }
                        }
                    }
                }
            },
            400: {
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
    fastify.post('/signup', {
        schema: schemas.signup,
        // Configurar explícitamente el content-type para JSON 
        contentType: 'application/json'
    }, async (request, reply) => {
        try {
            // Asegurarse de que tenemos un cuerpo de solicitud válido
            if (!request.body || typeof request.body !== 'object') {
                return reply.code(400).send({
                    success: false,
                    message: "Se requiere un objeto JSON válido"
                });
            }

            const data = request.body;

            // Log para depuración
            console.log("Datos recibidos en /signup:", data);

            // El avatar se subirá en un endpoint separado, así que pasamos null aquí
            const result = await authService.signup({ ...data, avatar_url: null });

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

    // Ruta para autenticación con Google
    fastify.post('/google-callback', { schema: schemas.googleCallback }, async (request, reply) => {
        try {
            const { supabaseToken } = request.body;

            if (!supabaseToken) {
                return reply.code(400).send({
                    success: false,
                    message: 'Token de Supabase requerido'
                });
            }

            // 1. Verificar el token de Supabase
            const { data: supabaseUser, error } = await fastify.supabase.auth.getUser(supabaseToken);

            if (error || !supabaseUser?.user) {
                return reply.code(401).send({
                    success: false,
                    message: 'Token de Supabase inválido'
                });
            }

            const googleUser = supabaseUser.user;

            // 2. Buscar usuario existente por email
            const { data: existingUser, error: findError } = await fastify.supabase
                .from('nomadas')
                .select('*')
                .eq('email', googleUser.email)
                .single();

            let user;

            if (existingUser) {
                // Usuario existe, actualizar datos de Google si es necesario
                const { data: updatedUser, error: updateError } = await fastify.supabase
                    .from('nomadas')
                    .update({
                        nombre: googleUser.user_metadata?.full_name || existingUser.nombre,
                        foto_perfil: googleUser.user_metadata?.avatar_url || existingUser.foto_perfil,
                        auth_provider: 'google',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingUser.id)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error('Error actualizando usuario: ' + updateError.message);
                }

                user = updatedUser;
            } else {
                // Crear nuevo usuario con datos de Google
                const nomadaId = await generateUniqueNomadaId(fastify.supabase, googleUser.user_metadata?.full_name || 'nomada');

                const { data: newUser, error: createError } = await fastify.supabase
                    .from('nomadas')
                    .insert([{
                        email: googleUser.email,
                        nombre: googleUser.user_metadata?.full_name || 'Usuario Google',
                        nomada_id: nomadaId,
                        foto_perfil: googleUser.user_metadata?.avatar_url,
                        auth_provider: 'google',
                        verificado: true, // Google users are pre-verified
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (createError) {
                    throw new Error('Error creando usuario: ' + createError.message);
                }

                user = newUser;
            }

            // 3. Generar JWT token propio del backend
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                nomada_id: user.nomada_id
            });

            // 4. Retornar formato consistente con login normal
            return reply.code(200).send({
                success: true,
                message: 'Autenticación exitosa',
                token,
                nomada: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    nomada_id: user.nomada_id,
                    foto_perfil: user.foto_perfil,
                    ubicacion_actual: user.ubicacion_actual,
                    verificado: user.verificado,
                    created_at: user.created_at
                }
            });

        } catch (error) {
            request.log.error('Error en Google callback:', error);
            return reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
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

    // RUTA TEMPORAL: Registro simplificado sin validación de esquema para solucionar el error "body must be object"
    fastify.post('/register-simple', {}, async (request, reply) => {
        try {
            console.log('Headers:', request.headers);
            console.log('Cuerpo recibido:', request.body);

            // Extraer los datos necesarios
            const { email, password, nomada_id, username, bio } = request.body;

            // Validación manual básica
            if (!email || !password || !nomada_id) {
                return reply.code(400).send({
                    success: false,
                    message: 'Los campos email, password y nomada_id son obligatorios'
                });
            }

            // Procesar el registro sin avatar
            const result = await authService.signup({
                email,
                password,
                nomada_id,
                username: username || null,
                bio: bio || null,
                avatar_url: null
            });

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
            console.error('Error completo:', error);
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Función auxiliar para generar nomada_id único
async function generateUniqueNomadaId(supabase, name) {
    let baseId = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10);

    if (!baseId) baseId = 'nomada';

    let counter = 1;
    let nomadaId = baseId;

    while (true) {
        const { data, error } = await supabase
            .from('nomadas')
            .select('id')
            .eq('nomada_id', nomadaId)
            .single();

        if (error && error.code === 'PGRST116') {
            // No existe, podemos usar este ID
            break;
        }

        nomadaId = `${baseId}${counter}`;
        counter++;
    }

    return nomadaId;
}

module.exports = authRoutes;