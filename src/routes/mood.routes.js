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
        required: ['moodType', 'userId', 'timestamp'],
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

    // Ruta para obtener todos los estados de ánimo (protegida)
    fastify.get('/', {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', default: 50 },
                    offset: { type: 'integer', default: 0 },
                    userId: { type: 'string' }
                }
            },
            response: {
                200: {
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
    }, async (request, reply) => {
        try {
            const { limit, offset, userId } = request.query;
            const moodsList = await moodService.getAllMoods({ limit, offset, userId });
            return moodsList;
        } catch (error) {
            request.log.error(`Error al obtener estados de ánimo: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para obtener un estado de ánimo por su ID
    fastify.get('/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: {
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
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const mood = await moodService.getMoodById(id);

            if (!mood) {
                return reply.code(404).send({
                    success: false,
                    message: `Estado de ánimo con ID ${id} no encontrado`
                });
            }

            return mood;
        } catch (error) {
            request.log.error(`Error al obtener estado de ánimo: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = routes; 