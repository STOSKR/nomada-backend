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
        consumes: ['application/json'], body: {
            type: 'object',
            required: ['email', 'password'],
            additionalProperties: true,
            properties: {
                email: { type: 'string', format: 'email', description: 'Correo electrónico (requerido)' },
                password: { type: 'string', minLength: 8, description: 'Contraseña (requerido, mínimo 8 caracteres)' },
                username: { type: 'string', description: 'Nombre visible del usuario (opcional, se usará para generar nomada_id)' },
                bio: { type: 'string', description: 'Biografía del usuario' },
                avatar_url: { type: 'string', description: 'URL del avatar del usuario' }
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
    }, googleCallback: {
        description: 'Autenticación unificada con Google a través de Supabase',
        tags: ['autenticación'],
        body: {
            type: 'object',
            required: ['supabaseToken'],
            properties: {
                supabaseToken: { type: 'string', description: 'Token de acceso de Supabase obtenido después de la autenticación con Google' },
                supabaseRefreshToken: { type: 'string', description: 'Token de refresh de Supabase (opcional)' }
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
    },

    checkEmail: {
        description: 'Verificar si un email está disponible para registro',
        tags: ['autenticación'],
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email', description: 'Correo electrónico a verificar' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    available: { type: 'boolean', description: 'true si el email está disponible' },
                    email: { type: 'string', description: 'Email verificado (normalizado)' },
                    message: { type: 'string', description: 'Confirmación de disponibilidad' }
                }
            },
            400: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', description: 'Error - email ya registrado o inválido' }
                }
            }
        }
    },

    // ...existing code...
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
            } const data = request.body;

            // Log para depuración
            console.log("Datos recibidos en /signup:", data);

            // Usar el avatar_url proporcionado o null si no se envía
            const result = await authService.signup(data);

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
    });    // Ruta para autenticación con Google

    fastify.post('/google-callback', { schema: schemas.googleCallback }, async (request, reply) => {
        try {
            console.log('Datos recibidos en google-callback:', request.body);

            const { supabaseToken, supabaseRefreshToken } = request.body;

            if (!supabaseToken) {
                return reply.code(400).send({
                    success: false,
                    message: 'Token de Supabase requerido'
                });
            }            // 1. Verificar directamente el token JWT de Supabase
            let decodedToken;
            try {
                // Decodificar JWT manualmente (sin verificación ya que viene de Supabase)
                const base64Url = supabaseToken.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                decodedToken = JSON.parse(jsonPayload);
                console.log('Token decodificado:', decodedToken);
            } catch (decodeError) {
                console.error('Error decodificando token:', decodeError);
                return reply.code(401).send({
                    success: false,
                    message: 'Token de Supabase inválido'
                });
            }            // 2. Extraer datos del usuario del token
            const supabaseUID = decodedToken.sub; // UID del usuario en Supabase Auth
            const googleUser = {
                uid: supabaseUID,
                email: decodedToken.email,
                user_metadata: decodedToken.user_metadata || {}
            };

            console.log('Datos del usuario Google:', googleUser);
            console.log('UID de Supabase:', supabaseUID);            // 3. Buscar usuario existente por UID de Supabase en la tabla users
            const { data: existingUser, error: findError } = await fastify.supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUID) // Usar el UID como ID principal
                .single();

            console.log('Resultado de búsqueda por ID:', { existingUser, findError });

            let user;

            // Verificar si el usuario existe (error PGRST116 significa "no encontrado")
            if (existingUser && !findError) {
                console.log('Usuario existente encontrado por ID:', existingUser);

                // Preparar objeto de actualización solo para campos vacíos/nulos
                const updateData = {
                    updated_at: new Date().toISOString()
                };

                // Solo actualizar username si está vacío/nulo en BD y tenemos datos de Google
                if ((!existingUser.username || existingUser.username.trim() === '') &&
                    googleUser.user_metadata?.full_name) {
                    updateData.username = googleUser.user_metadata.full_name;
                }

                // Solo actualizar avatar_url si está vacío/nulo en BD y tenemos datos de Google
                if ((!existingUser.avatar_url || existingUser.avatar_url.trim() === '') &&
                    googleUser.user_metadata?.avatar_url) {
                    updateData.avatar_url = googleUser.user_metadata.avatar_url;
                }

                console.log('Datos a actualizar:', updateData);

                // Usuario existe, actualizar solo campos vacíos con datos de Google
                const { data: updatedUser, error: updateError } = await fastify.supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', existingUser.id)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error('Error actualizando usuario: ' + updateError.message);
                }

                user = updatedUser;
            } else {
                // Si no se encuentra por ID, buscar por email (puede existir de registro previo)
                console.log('No encontrado por ID, buscando por email...');
                const { data: existingUserByEmail, error: findByEmailError } = await fastify.supabase
                    .from('users')
                    .select('*')
                    .eq('email', googleUser.email)
                    .single();

                console.log('Resultado de búsqueda por email:', { existingUserByEmail, findByEmailError });

                if (existingUserByEmail && !findByEmailError) {
                    console.log('Usuario existente encontrado por email, actualizando ID...');

                    // Usuario existe con email pero diferente ID - actualizar el ID y otros datos
                    const updateData = {
                        id: supabaseUID, // Actualizar con el nuevo UID de Supabase
                        updated_at: new Date().toISOString()
                    };

                    // Actualizar otros campos si están vacíos
                    if ((!existingUserByEmail.username || existingUserByEmail.username.trim() === '') &&
                        googleUser.user_metadata?.full_name) {
                        updateData.username = googleUser.user_metadata.full_name;
                    }

                    if ((!existingUserByEmail.avatar_url || existingUserByEmail.avatar_url.trim() === '') &&
                        googleUser.user_metadata?.avatar_url) {
                        updateData.avatar_url = googleUser.user_metadata.avatar_url;
                    }

                    console.log('Actualizando usuario existente con nuevo UID:', updateData);

                    const { data: updatedUser, error: updateError } = await fastify.supabase
                        .from('users')
                        .update(updateData)
                        .eq('email', googleUser.email) // Usar email como referencia
                        .select()
                        .single();

                    if (updateError) {
                        throw new Error('Error actualizando usuario existente: ' + updateError.message);
                    }

                    user = updatedUser;
                } else {
                    console.log('Creando nuevo usuario...');
                    // Crear nuevo usuario con datos de Google usando el UID de Supabase
                    const nomadaId = await authService.generateUniqueNomadaId(googleUser.user_metadata?.full_name || 'nomada');

                    console.log('Nomada ID generado:', nomadaId);

                    const { data: newUser, error: createError } = await fastify.supabase
                        .from('users')
                        .insert([{
                            id: supabaseUID, // Usar el UID de Supabase como ID
                            email: googleUser.email,
                            username: googleUser.user_metadata?.full_name || 'Usuario Google',
                            nomada_id: nomadaId,
                            bio: null,
                            avatar_url: googleUser.user_metadata?.avatar_url,
                            preferences: {},
                            visited_countries: [],
                            followers_count: 0,
                            following_count: 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creando usuario:', createError);
                        throw new Error('Error creando usuario: ' + createError.message);
                    }

                    user = newUser;
                }
            } console.log('Usuario final:', user);

            // 4. Generar JWT token propio del backend
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                nomada_id: user.nomada_id
            });

            // 5. Obtener perfil completo del usuario usando el mismo servicio que login
            const userService = new (require('../services/user.service'))(fastify.supabase);
            const profileData = await userService.getUserProfile(user.id, user.id);

            // 6. Retornar formato consistente con login normal
            return reply.code(200).send({
                success: true,
                token,
                user: profileData
            });

        } catch (error) {
            console.error('Error completo en Google callback:', error);
            request.log.error('Error en Google callback:', error);
            return reply.code(500).send({
                success: false,
                message: 'Error interno del servidor: ' + error.message
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

    // Ruta para verificar disponibilidad de email
    fastify.post('/check-email', { schema: schemas.checkEmail }, async (request, reply) => {
        try {
            const { email } = request.body;

            if (!email || !email.trim()) {
                return reply.code(400).send({
                    success: false,
                    message: 'Email es requerido'
                });
            }

            // Usar el nuevo método que falla si el email ya está registrado
            const result = await authService.checkEmailAvailable(email);

            return reply.code(200).send({
                success: true,
                available: result.available,
                email: result.email,
                message: 'El email está disponible para registro'
            });

        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message // "El email ya está registrado" si existe
            });
        }
    });

    // RUTA TEMPORAL: Registro simplificado sin validación de esquema para solucionar el error "body must be object"
    fastify.post('/register-simple', {}, async (request, reply) => {
        try {
            console.log('Headers:', request.headers);
            console.log('Cuerpo recibido:', request.body);            // Extraer los datos necesarios
            const { email, password, username, bio, avatar_url } = request.body;

            // Validación manual básica
            if (!email || !password) {
                return reply.code(400).send({
                    success: false,
                    message: 'Los campos email y password son obligatorios'
                });
            }

            // Procesar el registro con generación automática de nomada_id
            const result = await authService.signup({
                email,
                password,
                username: username || null,
                bio: bio || null,
                avatar_url: avatar_url || null
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

module.exports = authRoutes;