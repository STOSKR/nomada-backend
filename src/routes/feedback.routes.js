'use strict';

const feedbackService = require('../services/feedback.service');

/**
 * Rutas para el manejo de feedback
 * @param {FastifyInstance} fastify Instancia de Fastify
 * @param {Object} options Opciones del plugin
 */
async function routes(fastify, options) {
    // Esquema para la validación de datos del feedback
    const feedbackSchema = {
        type: 'object',
        required: ['selectedMood', 'userId', 'timestamp'],
        properties: {
            selectedMood: { type: 'string' },
            selectedTags: {
                type: 'array',
                items: { type: 'string' }
            },
            feedback: { type: 'string' },
            selectedMessageType: { type: 'string' },
            timestamp: { type: 'string' },
            userId: { type: 'string' }
        }
    };

    // Ruta para guardar feedback
    fastify.post('/', {
        schema: {
            body: feedbackSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'array' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await feedbackService.saveFeedback(request.body);
            return result;
        } catch (error) {
            request.log.error(`Error al guardar feedback: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para obtener todos los feedback (protegida con autenticación)
    fastify.get('/', {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', default: 50 },
                    offset: { type: 'integer', default: 0 }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            mood: { type: 'string' },
                            tags: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            comment: { type: ['string', 'null'] },
                            message_type: { type: ['string', 'null'] },
                            created_at: { type: 'string' },
                            user_id: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { limit, offset } = request.query;
            const feedbackList = await feedbackService.getAllFeedback({ limit, offset });
            return feedbackList;
        } catch (error) {
            request.log.error(`Error al obtener feedback: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = routes; 