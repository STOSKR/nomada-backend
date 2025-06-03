/**
 * Rutas para la gestión de fotos
 */
const PhotoService = require('../services/photo.service.js');
const { multerHandler } = require('../app'); // Importar utilidad de multer desde el módulo app
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const writeFile = util.promisify(fs.writeFile);
const path = require('path');
const { isVercelProd } = require('../app');

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

    // Esquema para eliminar imagen por public_id de Cloudinary
    deleteImageByPublicId: {
        description: 'Eliminar una imagen de Cloudinary usando su public_id',
        tags: ['fotos', 'cloudinary'],
        body: {
            type: 'object',
            required: ['public_id'],
            properties: {
                public_id: { type: 'string', description: 'Public ID de la imagen en Cloudinary' }
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
    if (!isVercelProd && !fs.existsSync('uploads')) {
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
            };            // Subir a Cloudinary directamente
            const uploadResult = await photoService.cloudinary.uploadImage(fileBuffer, uploadOptions);

            return {
                success: true,
                message: 'Foto subida correctamente',
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id, // Public_id correcto para eliminación
                cloudinary_public_id: uploadResult.public_id, // Mismo valor para claridad
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
            };            // Subir a Cloudinary directamente sin archivos temporales
            const uploadResult = await photoService.cloudinary.uploadImage(buffer, uploadOptions);

            return {
                success: true,
                message: 'Foto en base64 subida correctamente',
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id, // Public_id correcto para eliminación
                cloudinary_public_id: uploadResult.public_id, // Mismo valor para claridad
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
            console.log('URL segura de Cloudinary:', uploadResult.secure_url);            return {
                success: true,
                message: 'Avatar subido correctamente',
                id: avatarId,
                url: uploadResult.secure_url,
                public_id: avatarId, // Este es el public_id correcto para eliminación
                cloudinary_public_id: uploadResult.public_id, // Public_id retornado por Cloudinary
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
                }                console.log(`Avatar actualizado exitosamente para usuario ${user_id}`);

                return {
                    success: true,
                    message: 'Avatar actualizado correctamente',
                    id: avatarId,
                    url: uploadResult.secure_url,
                    public_id: avatarId, // Este es el public_id correcto para eliminación
                    cloudinary_public_id: uploadResult.public_id, // Public_id retornado por Cloudinary
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
    });    // Eliminar imagen de Cloudinary por public_id (sin autenticación)
    fastify.delete('/cloudinary', {
        schema: schemas.deleteImageByPublicId
    }, async (request, reply) => {
        try {
            const { public_id } = request.body;

            if (!public_id) {
                return reply.code(400).send({
                    success: false,
                    message: 'Se requiere el public_id de Cloudinary'
                });
            }

            console.log('Intentando eliminar imagen con public_id:', public_id);            // Validar formato del public_id - debe ser un formato válido de Cloudinary
            // No debe ser un UUID genérico
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(public_id)) {
                console.log('Error: Se recibió un UUID como public_id, pero los public_id de Cloudinary tienen formato diferente');                return reply.code(400).send({
                    success: false,
                    message: 'El public_id proporcionado no tiene el formato correcto. Los UUIDs no son public_ids válidos de Cloudinary.',
                    help: {
                        message: 'Use estos endpoints alternativos que extraen automáticamente el public_id de las URLs',
                        endpoints: {
                            'Delete photo by URL': 'DELETE /photo-by-url',
                            'Delete avatar by URL': 'DELETE /avatar-by-url',
                            'Extract public_id': 'POST /debug/extract-public-id',
                            'Check stored URLs': 'GET /debug/avatar-urls'
                        },
                        note: 'Las URLs de Cloudinary contienen el public_id correcto que necesita ser extraído'
                    }
                });
            }

            // Eliminar directamente de Cloudinary usando el public_id
            const result = await photoService.cloudinary.deleteImage(public_id);

            console.log('Resultado de eliminación de Cloudinary:', JSON.stringify(result, null, 2));

            if (result.result !== 'ok') {
                console.log(`Eliminación falló. Resultado: ${result.result}`);
                return reply.code(404).send({
                    success: false,
                    message: `Imagen no encontrada en Cloudinary. Resultado: ${result.result}`,
                    debug: {
                        public_id: public_id,
                        cloudinary_result: result.result
                    }
                });
            }

            return {
                success: true,
                message: 'Imagen eliminada correctamente de Cloudinary',
                public_id: public_id
            };
        } catch (error) {
            console.error('Error al eliminar imagen de Cloudinary:', error);
            request.log.error(error);

            return reply.code(400).send({
                success: false,
                message: error.message,
                debug: {
                    public_id: request.body.public_id
                }
            });
        }
    });

    // Debug endpoint: Obtener información de public_id desde URL (para debugging)
    fastify.post('/debug/extract-public-id', {
        schema: {
            description: 'Extraer public_id desde una URL de Cloudinary (para debugging)',
            tags: ['fotos', 'debug'],
            body: {
                type: 'object',
                required: ['url'],
                properties: {
                    url: { type: 'string', description: 'URL de Cloudinary' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        url: { type: 'string' },
                        extracted_public_id: { type: 'string' },
                        is_cloudinary_url: { type: 'boolean' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { url } = request.body;

            if (!url) {
                return reply.code(400).send({
                    success: false,
                    message: 'Se requiere una URL'
                });
            }

            console.log('Debug: Extrayendo public_id de URL:', url);

            // Verificar si es una URL de Cloudinary
            const isCloudinaryUrl = url.includes('cloudinary.com');

            if (!isCloudinaryUrl) {
                return {
                    success: false,
                    url: url,
                    extracted_public_id: null,
                    is_cloudinary_url: false,
                    message: 'No es una URL de Cloudinary'
                };
            }

            // Intentar extraer el public_id
            try {
                const publicId = photoService.cloudinary.extractPublicId(url);
                console.log('Debug: Public_id extraído:', publicId);

                return {
                    success: true,
                    url: url,
                    extracted_public_id: publicId,
                    is_cloudinary_url: true
                };
            } catch (extractError) {
                console.error('Debug: Error al extraer public_id:', extractError);
                return {
                    success: false,
                    url: url,
                    extracted_public_id: null,
                    is_cloudinary_url: true,
                    message: extractError.message
                };
            }
        } catch (error) {
            console.error('Debug: Error general:', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Debug endpoint to check avatar URLs in database
    fastify.get('/debug/avatar-urls', {
        schema: {
            description: 'Debug: Verificar URLs de avatar almacenadas en la base de datos',
            tags: ['debug'],
            querystring: {
                type: 'object',
                properties: {
                    user_id: { type: 'string', description: 'ID del usuario específico (opcional)' }
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
                                    user_id: { type: 'string' },
                                    username: { type: 'string' },
                                    avatar_url: { type: 'string' },
                                    extracted_public_id: { type: 'string' },
                                    is_cloudinary_url: { type: 'boolean' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { user_id } = request.query;
            
            let query = fastify.supabase
                .from('users')
                .select('id, username, avatar_url')
                .not('avatar_url', 'is', null);
            
            if (user_id) {
                query = query.eq('id', user_id);
            }
            
            const { data: users, error } = await query.limit(10);
            
            if (error) {
                throw new Error(`Error al consultar usuarios: ${error.message}`);
            }
            
            const result = users.map(user => {
                let extractedPublicId = null;
                let isCloudinaryUrl = false;
                
                if (user.avatar_url && user.avatar_url.includes('cloudinary.com')) {
                    isCloudinaryUrl = true;
                    try {
                        extractedPublicId = photoService.cloudinary.extractPublicId(user.avatar_url);
                    } catch (error) {
                        extractedPublicId = `Error: ${error.message}`;
                    }
                }
                
                return {
                    user_id: user.id,
                    username: user.username,
                    avatar_url: user.avatar_url,
                    extracted_public_id: extractedPublicId,
                    is_cloudinary_url: isCloudinaryUrl
                };
            });
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Utility endpoint to fix avatar public_ids in database
    fastify.post('/debug/fix-avatar-public-ids', {
        schema: {
            description: 'Debug: Extraer y almacenar public_ids correctos de las URLs existentes',
            tags: ['debug'],
            body: {
                type: 'object',
                properties: {
                    user_id: { type: 'string', description: 'ID del usuario específico (opcional, si no se proporciona se procesan todos)' },
                    dry_run: { type: 'boolean', default: true, description: 'Si es true, solo muestra qué se haría sin hacer cambios' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        dry_run: { type: 'boolean' },
                        processed: { type: 'integer' },
                        updates: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user_id: { type: 'string' },
                                    username: { type: 'string' },
                                    old_avatar_url: { type: 'string' },
                                    extracted_public_id: { type: 'string' },
                                    status: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { user_id, dry_run = true } = request.body;
            
            let query = fastify.supabase
                .from('users')
                .select('id, username, avatar_url')
                .not('avatar_url', 'is', null);
            
            if (user_id) {
                query = query.eq('id', user_id);
            }
            
            const { data: users, error } = await query;
            
            if (error) {
                throw new Error(`Error al consultar usuarios: ${error.message}`);
            }
            
            const updates = [];
            
            for (const user of users) {
                if (user.avatar_url && user.avatar_url.includes('cloudinary.com')) {
                    try {
                        const extractedPublicId = photoService.cloudinary.extractPublicId(user.avatar_url);
                        
                        const updateInfo = {
                            user_id: user.id,
                            username: user.username,
                            old_avatar_url: user.avatar_url,
                            extracted_public_id: extractedPublicId,
                            status: dry_run ? 'would_update' : 'updating'
                        };
                        
                        if (!dry_run) {
                            // Create a new field to store the public_id for deletion
                            const { error: updateError } = await fastify.supabase
                                .from('users')
                                .update({ 
                                    avatar_public_id: extractedPublicId // Add this field to store public_id
                                })
                                .eq('id', user.id);
                            
                            if (updateError) {
                                updateInfo.status = `error: ${updateError.message}`;
                            } else {
                                updateInfo.status = 'updated';
                            }
                        }
                        
                        updates.push(updateInfo);
                    } catch (error) {
                        updates.push({
                            user_id: user.id,
                            username: user.username,
                            old_avatar_url: user.avatar_url,
                            extracted_public_id: null,
                            status: `extraction_error: ${error.message}`
                        });
                    }
                }
            }
            
            return {
                success: true,
                dry_run,
                processed: updates.length,
                updates
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Delete avatar by URL (extracts public_id automatically)
    fastify.delete('/avatar-by-url', {
        schema: {
            description: 'Eliminar avatar proporcionando la URL completa de Cloudinary',
            tags: ['fotos', 'avatar'],
            body: {
                type: 'object',
                required: ['avatar_url'],
                properties: {
                    avatar_url: { 
                        type: 'string', 
                        description: 'URL completa del avatar en Cloudinary' 
                    },
                    user_id: { 
                        type: 'string', 
                        description: 'ID del usuario (opcional, para verificación)' 
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        extracted_public_id: { type: 'string' },
                        deletion_result: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { avatar_url, user_id } = request.body;

            if (!avatar_url) {
                return reply.code(400).send({
                    success: false,
                    message: 'Se requiere la URL del avatar'
                });
            }

            // Verificar que es una URL de Cloudinary
            if (!avatar_url.includes('cloudinary.com')) {
                return reply.code(400).send({
                    success: false,
                    message: 'La URL proporcionada no es de Cloudinary'
                });
            }

            let extractedPublicId;
            try {
                extractedPublicId = photoService.cloudinary.extractPublicId(avatar_url);
            } catch (error) {
                return reply.code(400).send({
                    success: false,
                    message: `No se pudo extraer el public_id de la URL: ${error.message}`
                });
            }

            console.log(`Deleting avatar with extracted public_id: "${extractedPublicId}" from URL: ${avatar_url}`);

            // Intentar eliminar la imagen de Cloudinary
            const result = await photoService.cloudinary.deleteImage(extractedPublicId);

            // Si se proporciona user_id, actualizar la base de datos
            if (user_id) {
                try {
                    const { error: updateError } = await fastify.supabase
                        .from('users')
                        .update({ avatar_url: null })
                        .eq('id', user_id);

                    if (updateError) {
                        console.warn(`Warning: Failed to update database for user ${user_id}:`, updateError);
                    } else {
                        console.log(`Database updated: removed avatar_url for user ${user_id}`);
                    }
                } catch (dbError) {
                    console.warn(`Warning: Database update error for user ${user_id}:`, dbError);
                }
            }

            return {
                success: true,
                message: result.result === 'ok' ? 
                    'Avatar eliminado correctamente' : 
                    `Eliminación parcial: ${result.result}`,
                extracted_public_id: extractedPublicId,
                deletion_result: result.result
            };

        } catch (error) {
            console.error('Error al eliminar avatar por URL:', error);
            return reply.code(500).send({
                success: false,
                message: `Error interno: ${error.message}`
            });
        }
    });

    // Delete photo by URL (extracts public_id automatically)
    fastify.delete('/photo-by-url', {
        schema: {
            description: 'Eliminar foto proporcionando la URL completa de Cloudinary',
            tags: ['fotos'],
            body: {
                type: 'object',
                required: ['photo_url'],
                properties: {
                    photo_url: { 
                        type: 'string', 
                        description: 'URL completa de la foto en Cloudinary' 
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        extracted_public_id: { type: 'string' },
                        deletion_result: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { photo_url } = request.body;

            if (!photo_url) {
                return reply.code(400).send({
                    success: false,
                    message: 'Se requiere la URL de la foto'
                });
            }

            // Verificar que es una URL de Cloudinary
            if (!photo_url.includes('cloudinary.com')) {
                return reply.code(400).send({
                    success: false,
                    message: 'La URL proporcionada no es de Cloudinary'
                });
            }

            let extractedPublicId;
            try {
                extractedPublicId = photoService.cloudinary.extractPublicId(photo_url);
            } catch (error) {
                return reply.code(400).send({
                    success: false,
                    message: `No se pudo extraer el public_id de la URL: ${error.message}`
                });
            }

            console.log(`Deleting photo with extracted public_id: "${extractedPublicId}" from URL: ${photo_url}`);

            // Intentar eliminar la imagen de Cloudinary
            const result = await photoService.cloudinary.deleteImage(extractedPublicId);

            return {
                success: true,
                message: result.result === 'ok' ? 
                    'Foto eliminada correctamente' : 
                    `Eliminación parcial: ${result.result}`,
                extracted_public_id: extractedPublicId,
                deletion_result: result.result
            };

        } catch (error) {
            console.error('Error al eliminar foto por URL:', error);
            return reply.code(500).send({
                success: false,
                message: `Error interno: ${error.message}`
            });
        }
    });
}

module.exports = photoRoutes;