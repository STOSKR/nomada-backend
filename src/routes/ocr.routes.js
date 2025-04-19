const OCRService = require('../services/ocr.service');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const path = require('path');

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
    processImage: {
        description: 'Procesa una imagen para extraer texto y optimizar rutas',
        tags: ['ocr'],
        security: [{ apiKey: [] }],
        consumes: ['multipart/form-data'],
        body: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo de imagen a procesar'
                },
                days: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Número de días para distribuir la ruta (opcional, por defecto 1)'
                },
                maxHoursPerDay: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Máximo de horas de actividad por día (opcional, por defecto 8)'
                }
            },
            required: ['image']
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    rawText: { type: 'string', description: 'Texto extraído de la imagen sin procesar' },
                    places: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                day: { type: 'integer' },
                                order_in_day: { type: 'integer' },
                                order_index: { type: 'integer' },
                                coordinates: {
                                    type: 'object',
                                    properties: {
                                        lat: { type: 'number' },
                                        lng: { type: 'number' }
                                    }
                                }
                            }
                        }
                    },
                    totalDays: { type: 'integer' }
                }
            }
        }
    },

    processImageURL: {
        description: 'Procesa una imagen desde URL para extraer texto y optimizar rutas',
        tags: ['ocr'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['imageUrl'],
            properties: {
                imageUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'URL de la imagen a procesar'
                },
                days: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Número de días para distribuir la ruta (opcional, por defecto 1)'
                },
                maxHoursPerDay: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Máximo de horas de actividad por día (opcional, por defecto 8)'
                }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    rawText: { type: 'string', description: 'Texto extraído de la imagen sin procesar' },
                    places: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                day: { type: 'integer' },
                                order_in_day: { type: 'integer' },
                                order_index: { type: 'integer' },
                                coordinates: {
                                    type: 'object',
                                    properties: {
                                        lat: { type: 'number' },
                                        lng: { type: 'number' }
                                    }
                                }
                            }
                        }
                    },
                    totalDays: { type: 'integer' }
                }
            }
        }
    },

    processBase64: {
        description: 'Procesa una imagen en formato base64 para extraer texto y optimizar rutas',
        tags: ['ocr'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['base64Image'],
            properties: {
                base64Image: {
                    type: 'string',
                    description: 'Imagen en formato base64'
                },
                days: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Número de días para distribuir la ruta (opcional, por defecto 1)'
                },
                maxHoursPerDay: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Máximo de horas de actividad por día (opcional, por defecto 8)'
                }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    rawText: { type: 'string', description: 'Texto extraído de la imagen sin procesar' },
                    places: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                day: { type: 'integer' },
                                order_in_day: { type: 'integer' },
                                order_index: { type: 'integer' },
                                coordinates: {
                                    type: 'object',
                                    properties: {
                                        lat: { type: 'number' },
                                        lng: { type: 'number' }
                                    }
                                }
                            }
                        }
                    },
                    totalDays: { type: 'integer' }
                }
            }
        }
    }
};

/**
 * Plugin de Fastify para las rutas de OCR
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function ocrRoutes(fastify, options) {
    // Instancia del servicio OCR
    const ocrService = new OCRService(fastify.supabase);

    // Determinar directorio temporal según entorno
    const tempDir = process.env.NODE_ENV === 'production'
        ? '/tmp'
        : path.join(__dirname, '../../temp');

    console.log(`ocr.routes: Usando directorio temporal ${tempDir}`);

    // Crear carpeta temporal si no existe y no estamos en producción
    if (process.env.NODE_ENV !== 'production' && !fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Ruta para procesar imagen subida directamente
    fastify.post('/process-image', {
        schema: schemas.processImage,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.code(400).send({
                    success: false,
                    message: "No se ha proporcionado ninguna imagen"
                });
            }

            // Leer configuración
            const days = request.body?.days || 1;
            const maxHoursPerDay = request.body?.maxHoursPerDay || 8;

            // Guardar archivo temporalmente
            const buffer = await data.toBuffer();
            const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${data.filename}`);
            await writeFileAsync(tempFilePath, buffer);

            // Procesar imagen con OCR
            const ocrResult = await ocrService.processImage(tempFilePath);

            // Optimizar ruta
            const optimizedRoute = await ocrService.optimizeRoute(
                ocrResult.processedData.places,
                { days, maxHoursPerDay }
            );

            // Eliminar archivo temporal
            fs.unlink(tempFilePath, err => {
                if (err) console.warn('Error eliminando archivo temporal:', err);
            });

            return reply.code(200).send({
                success: true,
                rawText: ocrResult.rawText,
                places: optimizedRoute.places,
                totalDays: optimizedRoute.totalDays
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: `Error al procesar imagen: ${error.message}`
            });
        }
    });

    // Ruta para procesar imagen desde URL
    fastify.post('/process-image-url', {
        schema: schemas.processImageURL,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { imageUrl, days = 1, maxHoursPerDay = 8 } = request.body;

            if (!imageUrl) {
                return reply.code(400).send({
                    success: false,
                    message: "No se ha proporcionado una URL de imagen válida"
                });
            }

            // Procesar imagen con OCR
            const ocrResult = await ocrService.processImage(imageUrl);

            // Optimizar ruta
            const optimizedRoute = await ocrService.optimizeRoute(
                ocrResult.processedData.places,
                { days, maxHoursPerDay }
            );

            return reply.code(200).send({
                success: true,
                rawText: ocrResult.rawText,
                places: optimizedRoute.places,
                totalDays: optimizedRoute.totalDays
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: `Error al procesar imagen desde URL: ${error.message}`
            });
        }
    });

    // Ruta para procesar imagen en formato base64
    fastify.post('/process-base64', {
        schema: schemas.processBase64,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { base64Image, days = 1, maxHoursPerDay = 8 } = request.body;

            if (!base64Image) {
                return reply.code(400).send({
                    success: false,
                    message: "No se ha proporcionado una imagen en formato base64"
                });
            }

            // Extraer la parte de datos si viene con prefijo (data:image/...)
            let imageData = base64Image;
            if (base64Image.includes('base64,')) {
                imageData = base64Image.split('base64,')[1];
            }

            // Convertir base64 a buffer
            const buffer = Buffer.from(imageData, 'base64');

            // Guardar archivo temporalmente
            const tempFilePath = path.join(tempDir, `temp_${Date.now()}.png`);
            await writeFileAsync(tempFilePath, buffer);

            // Procesar imagen con OCR
            const ocrResult = await ocrService.processImage(tempFilePath);

            // Optimizar ruta
            const optimizedRoute = await ocrService.optimizeRoute(
                ocrResult.processedData.places,
                { days, maxHoursPerDay }
            );

            // Eliminar archivo temporal
            fs.unlink(tempFilePath, err => {
                if (err) console.warn('Error eliminando archivo temporal:', err);
            });

            return reply.code(200).send({
                success: true,
                rawText: ocrResult.rawText,
                places: optimizedRoute.places,
                totalDays: optimizedRoute.totalDays
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: `Error al procesar imagen base64: ${error.message}`
            });
        }
    });
}

module.exports = ocrRoutes; 