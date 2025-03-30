/**
 * Rutas para la gestión de fotos
 */
const PhotoService = require('../services/photo.service');

/**
 * Esquemas para validación y documentación
 */
const schemas = {
    // Esquema para listar fotos del usuario
    getUserPhotos: {
        description: 'Obtener fotos del usuario',
        tags: ['fotos'],
        security: [{ apiKey: [] }],
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
                        filename: { type: 'string' },
                        public_url: { type: 'string' },
                        width: { type: 'integer' },
                        height: { type: 'integer' },
                        size: { type: 'integer' },
                        mime_type: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        place_id: { type: 'string' }
                    }
                }
            }
        }
    },

    // Esquema para obtener una foto específica
    getPhoto: {
        description: 'Obtener detalles de una foto',
        tags: ['fotos'],
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
                    filename: { type: 'string' },
                    public_url: { type: 'string' },
                    width: { type: 'integer' },
                    height: { type: 'integer' },
                    size: { type: 'integer' },
                    mime_type: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    place_id: { type: 'string' },
                    caption: { type: 'string' },
                    user_id: { type: 'string' }
                }
            }
        }
    },

    // Esquema para crear una foto
    createPhoto: {
        description: 'Registrar una nueva foto',
        tags: ['fotos'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['filename', 'public_url'],
            properties: {
                filename: { type: 'string' },
                public_url: { type: 'string' },
                width: { type: 'integer' },
                height: { type: 'integer' },
                size: { type: 'integer' },
                mime_type: { type: 'string' }
            }
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    photo: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            filename: { type: 'string' },
                            public_url: { type: 'string' }
                        }
                    }
                }
            }
        }
    },

    // Esquema para actualizar una foto
    updatePhoto: {
        description: 'Actualizar metadatos de una foto',
        tags: ['fotos'],
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
                filename: { type: 'string' },
                caption: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    photo: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            filename: { type: 'string' },
                            caption: { type: 'string' }
                        }
                    }
                }
            }
        }
    },

    // Esquema para eliminar una foto
    deletePhoto: {
        description: 'Eliminar una foto',
        tags: ['fotos'],
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

    // Esquema para obtener URL firmada para subir foto
    getUploadUrl: {
        description: 'Obtener URL firmada para subir una foto',
        tags: ['fotos'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['filename'],
            properties: {
                filename: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    upload: {
                        type: 'object',
                        properties: {
                            signedUrl: { type: 'string' },
                            path: { type: 'string' },
                            publicUrl: { type: 'string' },
                            key: { type: 'string' }
                        }
                    }
                }
            }
        }
    }
};

/**
 * Plugin de Fastify para rutas de fotos
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function photoRoutes(fastify, options) {
    // Instancia del servicio de fotos
    const photoService = new PhotoService(fastify.supabase);

    // Listar fotos del usuario
    fastify.get('/', {
        schema: schemas.getUserPhotos,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { limit, offset } = request.query;

            const photos = await photoService.getUserPhotos(userId, { limit, offset });

            return photos;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Obtener una foto específica
    fastify.get('/:id', {
        schema: schemas.getPhoto,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const photoId = request.params.id;
            const userId = request.user.id;

            const photo = await photoService.getPhoto(photoId, userId);

            return photo;
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Foto no encontrada') {
                return reply.code(404).send({
                    success: false,
                    message: 'Foto no encontrada'
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

    // Registrar una nueva foto
    fastify.post('/', {
        schema: schemas.createPhoto,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const photoData = request.body;

            const photo = await photoService.createPhoto(photoData, userId);

            return reply.code(201).send({
                success: true,
                message: 'Foto registrada correctamente',
                photo
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Actualizar metadatos de una foto
    fastify.put('/:id', {
        schema: schemas.updatePhoto,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const photoId = request.params.id;
            const updateData = request.body;

            const photo = await photoService.updatePhoto(photoId, updateData, userId);

            return {
                success: true,
                message: 'Foto actualizada correctamente',
                photo
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Foto no encontrada') {
                return reply.code(404).send({
                    success: false,
                    message: 'Foto no encontrada'
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

    // Eliminar una foto
    fastify.delete('/:id', {
        schema: schemas.deletePhoto,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const photoId = request.params.id;

            await photoService.deletePhoto(photoId, userId);

            return {
                success: true,
                message: 'Foto eliminada correctamente'
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Foto no encontrada') {
                return reply.code(404).send({
                    success: false,
                    message: 'Foto no encontrada'
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

    // Obtener URL para subir foto
    fastify.post('/upload-url', {
        schema: schemas.getUploadUrl,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { filename } = request.body;

            const uploadData = await photoService.getUploadUrl(filename, userId);

            return {
                success: true,
                message: 'URL de subida generada correctamente',
                upload: uploadData
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = photoRoutes; 