/**
 * Rutas para la gestión de fotos
 */
const PhotoService = require('../services/photo.service');
const { multerHandler } = require('../app'); // Importar utilidad de multer desde el módulo app
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const writeFile = util.promisify(fs.writeFile);
const path = require('path');

/**
 * Esquemas para validación y documentación
 */
const schemas = {
    // Esquema para subida directa de foto
    uploadPhoto: {
        description: 'Subir una foto directamente al servidor',
        tags: ['fotos'],
        security: [{ apiKey: [] }],
        consumes: ['multipart/form-data'],
        body: {
            type: 'object',
            properties: {
                place_id: { type: 'string' },
                position: { type: 'string' }
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
                            public_url: { type: 'string' }
                        }
                    }
                }
            }
        }
    },

    // Esquema para subida de foto en base64
    uploadBase64Photo: {
        description: 'Subir una foto en formato base64',
        tags: ['fotos'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['image'],
            properties: {
                image: { type: 'string' },
                filename: { type: 'string' },
                place_id: { type: 'string' },
                position: { type: 'string' }
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
                            public_url: { type: 'string' }
                        }
                    }
                }
            }
        }
    },

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
                        optimized_url: { type: 'string' },
                        width: { type: 'integer' },
                        height: { type: 'integer' },
                        size: { type: 'integer' },
                        mime_type: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        place_id: { type: 'string' },
                        position: { type: 'string' }
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
                    position: { type: 'string' },
                    caption: { type: 'string' },
                    user_id: { type: 'string' },
                    variants: { 
                        type: 'object',
                        properties: {
                            thumbnail: { type: 'string' },
                            medium: { type: 'string' },
                            large: { type: 'string' },
                            original: { type: 'string' }
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
                caption: { type: 'string' },
                place_id: { type: 'string' },
                position: { type: 'string' }
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
                            caption: { type: 'string' },
                            place_id: { type: 'string' },
                            position: { type: 'string' }
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
};

/**
 * Plugin de Fastify para rutas de fotos
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function photoRoutes(fastify, options) {
    // Crear carpeta de uploads si no existe
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }
    
    // Instancia del servicio de fotos
    const photoService = new PhotoService(fastify.supabase);

    // Middleware para imprimir información de depuración antes de la autenticación
    const debugRequestMiddleware = (request, reply, done) => {
        console.log('\n----- INFORMACIÓN DE DEPURACIÓN -----');
        console.log('URI de la solicitud:', request.url);
        console.log('Método HTTP:', request.method);
        console.log('Encabezados recibidos:', JSON.stringify(request.headers, null, 2));
        console.log('Authorization:', request.headers.authorization || 'No proporcionado');
        console.log('Content-Type:', request.headers['content-type'] || 'No especificado');
        console.log('Body (parcial):', request.body ? Object.keys(request.body) : 'No disponible');
        console.log('Query params:', request.query);
        console.log('----------------------------------\n');
        done();
    };

    // Subir foto directamente
    fastify.post('/upload', {
        schema: schemas.uploadPhoto,
        preValidation: [debugRequestMiddleware, fastify.authenticate],
        preHandler: multerHandler('photo')
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const file = request.file;
            
            if (!file) {
                return reply.code(400).send({
                    success: false,
                    message: 'No se ha proporcionado ningún archivo'
                });
            }

            // Log para debugging
            console.log('request.body:', request.body);
            console.log('place_id:', request.body.place_id);
            console.log('position:', request.body.position);
            console.log('file:', {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path
            });

            // Obtener los campos adicionales
            const place_id = request.body.place_id;
            const position = request.body.position;
            
            const additionalData = {};
            if (place_id) additionalData.place_id = place_id;
            if (position) additionalData.position = position;

            // Subir a Cloudinary y registrar
            const photo = await photoService.uploadAndRegisterPhoto(
                file.path,
                file.originalname,
                userId,
                additionalData
            );

            // Eliminar archivo temporal
            await unlinkFile(file.path);

            return {
                success: true,
                message: 'Foto subida y registrada correctamente',
                photo,
                debug: {
                    receivedPlaceId: place_id || null,
                    receivedPosition: position || null,
                    bodyKeys: Object.keys(request.body)
                }
            };
        } catch (error) {
            request.log.error(error);
            
            // Intentar eliminar el archivo temporal si existe
            if (request.file && request.file.path) {
                try {
                    await unlinkFile(request.file.path);
                } catch (unlinkError) {
                    request.log.error('Error al eliminar archivo temporal:', unlinkError);
                }
            }

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Subir foto en formato base64
    fastify.post('/upload-base64', {
        schema: schemas.uploadBase64Photo,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { image, filename, place_id, position } = request.body;
            
            if (!image) {
                return reply.code(400).send({
                    success: false,
                    message: 'No se ha proporcionado imagen en base64'
                });
            }

            // Validar formato base64
            let base64Data = image;
            let fileExt = 'jpg';
            let tempFilename = filename || `temp_${Date.now()}.${fileExt}`;
            
            // Si la imagen incluye el prefijo data:image, extraer solo los datos
            if (base64Data.startsWith('data:image')) {
                const parts = base64Data.split(';base64,');
                if (parts.length === 2) {
                    // Extraer extensión del tipo MIME
                    const mimeType = parts[0].replace('data:', '');
                    fileExt = mimeType.split('/')[1] || fileExt;
                    base64Data = parts[1];
                    
                    // Asegurar que el nombre del archivo tiene la extensión correcta
                    if (filename && !filename.endsWith(`.${fileExt}`)) {
                        tempFilename = `${filename}.${fileExt}`;
                    } else if (!filename) {
                        tempFilename = `temp_${Date.now()}.${fileExt}`;
                    }
                }
            }

            // Crear archivo temporal
            const tempFilePath = path.join('uploads', tempFilename);
            const buffer = Buffer.from(base64Data, 'base64');
            await writeFile(tempFilePath, buffer);

            // Agregar datos adicionales
            const additionalData = {};
            if (place_id) additionalData.place_id = place_id;
            if (position) additionalData.position = position;

            // Subir a Cloudinary y registrar
            const photo = await photoService.uploadAndRegisterPhoto(
                tempFilePath,
                tempFilename,
                userId,
                additionalData
            );

            // Eliminar archivo temporal
            await unlinkFile(tempFilePath);

            return {
                success: true,
                message: 'Foto en base64 subida y registrada correctamente',
                photo
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

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
}

module.exports = photoRoutes; 