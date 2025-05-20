'use strict';

const moodService = require('../services/mood.service');

/**
 * Rutas para el manejo de estados de ánimo (moods)
 * @param {FastifyInstance} fastify Instancia de Fastify
 * @param {Object} options Opciones del plugin
 */
async function routes(fastify, options) {
    // Esquema para la validación de datos del estado de ánimo
    const moodSchema = {
        type: 'object',
        required: ['moodType', 'userId'],
        properties: {
            moodType: { type: 'string' },
            userId: { type: 'string' },
            timestamp: { type: 'string' }
        }
    };

    // Ruta para guardar un estado de ánimo
    fastify.post('/', {
        schema: {
            body: moodSchema,
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
                                    id: { type: 'integer' },
                                    mood_type: { type: 'string' },
                                    user_id: { type: 'string' },
                                    created_at: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await moodService.saveMood(request.body);
            return result;
        } catch (error) {
            request.log.error(`Error al guardar estado de ánimo: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = routes; 