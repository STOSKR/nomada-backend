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
                routeId: { type: 'string', description: 'ID de la ruta a la que pertenece la foto' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    url: { type: 'string' },
                    width: { type: 'integer' },
                    height: { type: 'integer' },
                    format: { type: 'string' },
                    size: { type: 'integer' }
                }
            }
        }
    },

    // Esquema para subida de avatar en base64 sin autenticación
    uploadAvatarBase64: {
        description: 'Subir un avatar en formato base64 sin requerir autenticación',
        tags: ['fotos', 'avatar'],
        body: {
            type: 'object',
            required: ['image'],
            properties: {
                image: { type: 'string' },
                filename: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    id: { type: 'string' },
                    url: { type: 'string' },
                    width: { type: 'integer' },
                    height: { type: 'integer' },
                    format: { type: 'string' },
                    size: { type: 'integer' }
                }
            }
        }
    },

    // Esquema para actualizar avatar en base64
    updateAvatarBase64: {
        description: 'Actualizar un avatar existente usando base64 sin requerir autenticación',
        tags: ['fotos', 'avatar'],
        body: {
            type: 'object',
            required: ['image', 'user_id'],
            properties: {
                image: { type: 'string' },
                filename: { type: 'string' },
                user_id: { type: 'string', description: 'ID del usuario cuyo avatar se está actualizando' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    url: { type: 'string' },
                    width: { type: 'integer' },
                    height: { type: 'integer' },
                    format: { type: 'string' },
                    size: { type: 'integer' }
                }
            }
        }
    },

    // Esquema para eliminar avatar
    deleteAvatar: {
        description: 'Eliminar un avatar existente sin requerir autenticación',
        tags: ['fotos', 'avatar'],
        body: {
            type: 'object',
            required: ['url'],
            properties: {
                url: { type: 'string', description: 'URL de Cloudinary de la imagen a eliminar' }
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
                routeId: { type: 'string', description: 'ID de la ruta a la que pertenece la foto' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    url: { type: 'string' },
                    width: { type: 'integer' },
                    height: { type: 'integer' },
                    format: { type: 'string' },
                    size: { type: 'integer' }
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
        done();
    };

    // Subir foto directamente (nueva implementación usando @fastify/multipart)
    fastify.post('/upload', {
        schema: schemas.uploadPhoto,
        preValidation: [debugRequestMiddleware, fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const routeId = request.body.routeId || 'default';

            // Procesar la subida usando @fastify/multipart directamente
            const parts = request.parts();

            // Variables para almacenar la imagen y los campos
            let fileBuffer = null;
            let fileInfo = null;

            // Procesar cada parte del multipart
            for await (const part of parts) {
                if (part.type === 'file') {
                    // Guardar información del archivo
                    fileInfo = {
                        filename: part.filename,
                        mimetype: part.mimetype,
                        encoding: part.encoding,
                        fieldname: part.fieldname
                    };

                    // Leer el archivo como buffer
                    fileBuffer = await part.toBuffer();
                }
            }

            // Verificar si se recibió un archivo
            if (!fileBuffer || !fileInfo) {
                return reply.code(400).send({
                    success: false,
                    message: 'No se ha proporcionado ningún archivo'
                });
            }

            // Subir directamente a Cloudinary sin guardar en base de datos
            const safeFilename = photoService.sanitizeFilename(fileInfo.filename || `upload_${Date.now()}`);

            // Configuración para Cloudinary
            const uploadOptions = {
                folder: `${userId}/${routeId}/`,
                public_id: safeFilename.split('.')[0],
                // Optimizaciones
                quality: 'auto',
                fetch_format: 'auto'
            };

            // Subir a Cloudinary directamente
            const uploadResult = await photoService.cloudinary.uploadImage(fileBuffer, uploadOptions);

            return {
                success: true,
                message: 'Foto subida correctamente',
                url: uploadResult.secure_url,
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format,
                size: uploadResult.bytes
            };
        } catch (error) {
            request.log.error(error);

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
            const { image, filename } = request.body;
            const routeId = request.body.routeId || 'default';

            if (!image) {
                return reply.code(400).send({
                    success: false,
                    message: 'No se ha proporcionado imagen en base64'
                });
            }

            // Procesar base64
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

            // Convertir base64 a buffer directamente
            const buffer = Buffer.from(base64Data, 'base64');

            // Generar un nombre seguro
            const safeFilename = photoService.sanitizeFilename(tempFilename);

            // Configuración para Cloudinary
            const uploadOptions = {
                folder: `${userId}/${routeId}/`,
                public_id: safeFilename.split('.')[0],
                // Optimizaciones
                quality: 'auto',
                fetch_format: 'auto'
            };

            // Subir a Cloudinary directamente sin archivos temporales
            const uploadResult = await photoService.cloudinary.uploadImage(buffer, uploadOptions);

            return {
                success: true,
                message: 'Foto en base64 subida correctamente',
                url: uploadResult.secure_url,
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format,
                size: uploadResult.bytes
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

    // Eliminar avatar (sin autenticación)
    fastify.delete('/avatar', {
        schema: schemas.deleteAvatar
    }, async (request, reply) => {
        try {
            const { url } = request.body;

            if (!url) {
                return reply.code(400).send({
                    success: false,
                    message: 'Se requiere la URL de la imagen a eliminar'
                });
            }

            console.log('Intentando eliminar imagen con URL:', url);

            // Extraer el public_id de la URL de Cloudinary
            // Ejemplo de URL: https://res.cloudinary.com/dqxvjfxdo/image/upload/v1742589999/nomada/avatars/avatar_1742589997818_123.jpg
            let publicId;
            try {
                const regex = /\/v\d+\/(.+)$/;
                const match = url.match(regex);
                if (match && match[1]) {
                    // Quitar la extensión del archivo
                    publicId = match[1].replace(/\.[^/.]+$/, "");
                    console.log('Public ID extraído:', publicId);
                } else {
                    throw new Error('No se pudo extraer el public_id de la URL');
                }
            } catch (error) {
                console.error('Error al extraer el public_id:', error);
                return reply.code(400).send({
                    success: false,
                    message: 'URL de Cloudinary inválida'
                });
            }

            // Eliminar de Cloudinary
            const result = await photoService.cloudinary.deleteImage(publicId);

            if (result.result !== 'ok') {
                return reply.code(404).send({
                    success: false,
                    message: 'Avatar no encontrado o ya eliminado'
                });
            }

            return {
                success: true,
                message: 'Avatar eliminado correctamente'
            };
        } catch (error) {
            console.error('Error al eliminar avatar:', error);
            request.log.error(error);

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Subir avatar en formato base64 (sin autenticación)
    fastify.post('/avatar', {
        schema: schemas.uploadAvatarBase64
    }, async (request, reply) => {
        try {
            console.log('Iniciando procesamiento de avatar en base64');
            const { image, filename } = request.body;

            if (!image) {
                console.error('Error: No se ha proporcionado imagen en base64');
                return reply.code(400).send({
                    success: false,
                    message: 'No se ha proporcionado imagen en base64'
                });
            }

            // Procesar base64
            let base64Data = image;
            let fileExt = 'jpg';
            let tempFilename = filename || `avatar_${Date.now()}.${fileExt}`;

            console.log('Procesando imagen base64');

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
                        tempFilename = `avatar_${Date.now()}.${fileExt}`;
                    }
                }
            }

            // Convertir base64 a buffer directamente
            const buffer = Buffer.from(base64Data, 'base64');
            console.log('Buffer creado de base64, tamaño:', buffer.length);

            // Generar ID único para el avatar
            const avatarId = `avatar_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            console.log('ID generado para el avatar:', avatarId);

            // Configuración específica para avatares con optimizaciones mejoradas
            const uploadOptions = {
                folder: 'nomada/avatars',
                public_id: avatarId,
                // Optimizaciones avanzadas para avatar
                quality: 'auto:best', // Mejor calidad automática
                fetch_format: 'auto',
                width: 500, // Tamaño estándar para avatares
                height: 500,
                crop: 'fill',
                gravity: 'face', // Priorizar rostros si los hay
                radius: 'max', // Hacer redondo el avatar (opcional)
                dpr: 'auto' // Optimización para diferentes densidades de píxeles
            };

            console.log('Iniciando subida a Cloudinary con opciones:', uploadOptions);

            // Subir a Cloudinary directamente
            const uploadResult = await photoService.cloudinary.uploadImage(buffer, uploadOptions);
            console.log('URL segura de Cloudinary:', uploadResult.secure_url);

            return {
                success: true,
                message: 'Avatar subido correctamente',
                id: avatarId,
                url: uploadResult.secure_url,
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format,
                size: uploadResult.bytes
            };
        } catch (error) {
            console.error('Error al subir avatar en base64:', error);
            request.log.error(error);

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Actualizar avatar en formato base64 (sin autenticación)
    fastify.put('/avatar', {
        schema: schemas.updateAvatarBase64
    }, async (request, reply) => {
        try {
            const { image, user_id } = request.body;

            if (!image) {
                console.error('Error: No se ha proporcionado imagen en base64');
                return reply.code(400).send({
                    success: false,
                    message: 'No se ha proporcionado imagen en base64'
                });
            }

            if (!user_id) {
                console.error('Error: No se ha proporcionado el ID del usuario');
                return reply.code(400).send({
                    success: false,
                    message: 'Se requiere el ID del usuario para actualizar su avatar'
                });
            }

            // Procesar base64
            let base64Data = image;
            let fileExt = 'jpg';

            // Si la imagen incluye el prefijo data:image, extraer solo los datos
            if (base64Data.startsWith('data:image')) {
                const parts = base64Data.split(';base64,');
                if (parts.length === 2) {
                    // Extraer extensión del tipo MIME
                    const mimeType = parts[0].replace('data:', '');
                    fileExt = mimeType.split('/')[1] || fileExt;
                    base64Data = parts[1];
                }
            }

            // Convertir base64 a buffer directamente
            const buffer = Buffer.from(base64Data, 'base64');

            // Generar ID único para el avatar
            const avatarId = `avatar_${user_id}_${Date.now()}`;

            // Configuración específica para avatares con optimizaciones mejoradas
            const uploadOptions = {
                folder: 'nomada/avatars',
                public_id: avatarId,
                // Optimizaciones avanzadas para avatar
                quality: 'auto:best', // Mejor calidad automática
                fetch_format: 'auto',
                width: 500, // Tamaño estándar para avatares
                height: 500,
                crop: 'fill',
                gravity: 'face', // Priorizar rostros si los hay
                radius: 'max', // Hacer redondo el avatar (opcional)
                dpr: 'auto' // Optimización para diferentes densidades de píxeles
            };
            // Subir a Cloudinary directamente
            const uploadResult = await photoService.cloudinary.uploadImage(buffer, uploadOptions);
            console.log('URL segura de Cloudinary:', uploadResult.secure_url);
            console.log('Tipo de user_id:', typeof user_id, 'Valor:', user_id);

            try {
                // Actualizar directamente sin verificación previa
                console.log('Intentando actualización directa en users para ID:', user_id);
                const { error: updateError } = await fastify.supabase
                    .from('users')
                    .update({ avatar_url: uploadResult.secure_url })
                    .eq('id', user_id);

                if (updateError) {
                    console.error('Error en actualización directa:', updateError);
                    // Intentar un método alternativo con RPC
                    console.log('Intentando actualización mediante función RPC');
                    const { error: rpcError } = await fastify.supabase.rpc('update_avatar_url', {
                        user_identifier: user_id,
                        new_avatar_url: uploadResult.secure_url
                    });

                    if (rpcError) {
                        console.error('Error en actualización RPC:', rpcError);
                        throw new Error(`No se pudo actualizar el avatar: ${rpcError.message}`);
                    }
                }

                console.log(`Avatar actualizado exitosamente para usuario ${user_id}`);

                return {
                    success: true,
                    message: 'Avatar actualizado correctamente',
                    url: uploadResult.secure_url,
                    width: uploadResult.width,
                    height: uploadResult.height,
                    format: uploadResult.format,
                    size: uploadResult.bytes
                };
            } catch (dbError) {
                console.error('Error crítico en base de datos:', dbError);
                throw new Error(`Error al actualizar avatar: ${dbError.message}`);
            }
        } catch (error) {
            console.error('Error al actualizar avatar en base64:', error);
            request.log.error(error);

            return reply.code(400).send({
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