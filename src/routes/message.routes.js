'use strict';

const messageService = require('../services/message.service');

/**
 * Rutas para el manejo de mensajes de feedback
 * @param {FastifyInstance} fastify Instancia de Fastify
 * @param {Object} options Opciones del plugin
 */
async function routes(fastify, options) {
    // Esquema para la validación de datos de mensajes
    const messageSchema = {
        type: 'object',
        required: ['userId'],
        properties: {
            message: { type: 'string' },
            messageType: { type: 'string' },
            userId: { type: 'string' },
            timestamp: { type: 'string' }
        }
    };

    // Ruta para guardar un mensaje de feedback
    fastify.post('/', {
        schema: {
            body: messageSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: ['array', 'null'],
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    message: { type: ['string', 'null'] },
                                    message_type: { type: ['string', 'null'] },
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
            const result = await messageService.saveMessage(request.body);
            return result;
        } catch (error) {
            request.log.error(`Error al guardar mensaje de feedback: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para obtener todos los mensajes (protegida)
    fastify.get('/', {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', default: 50 },
                    offset: { type: 'integer', default: 0 },
                    moodId: { type: 'integer' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            message: { type: ['string', 'null'] },
                            message_type: { type: ['string', 'null'] },
                            user_id: { type: 'string' },
                            mood_id: { type: 'integer' },
                            created_at: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { limit, offset, moodId } = request.query;
            const messagesList = await messageService.getAllMessages({ limit, offset, moodId });
            return messagesList;
        } catch (error) {
            request.log.error(`Error al obtener mensajes de feedback: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para obtener un mensaje por su ID
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
                        message: { type: ['string', 'null'] },
                        message_type: { type: ['string', 'null'] },
                        user_id: { type: 'string' },
                        mood_id: { type: 'integer' },
                        created_at: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const message = await messageService.getMessageById(id);

            if (!message) {
                return reply.code(404).send({
                    success: false,
                    message: `Mensaje con ID ${id} no encontrado`
                });
            }

            return message;
        } catch (error) {
            request.log.error(`Error al obtener mensaje: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = routes; 