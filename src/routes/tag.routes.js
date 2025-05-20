'use strict';

const tagService = require('../services/tag.service');

/**
 * Rutas para el manejo de etiquetas (tags)
 * @param {FastifyInstance} fastify Instancia de Fastify
 * @param {Object} options Opciones del plugin
 */
async function routes(fastify, options) {
    // Esquema para la validación de datos de etiquetas
    const tagSchema = {
        type: 'object',
        required: ['tags', 'userId', 'moodId'],
        properties: {
            tags: {
                type: 'array',
                items: { type: 'string' }
            },
            userId: { type: 'string' },
            moodId: { type: 'integer' },
            timestamp: { type: 'string' }
        }
    };

    // Ruta para guardar etiquetas
    fastify.post('/', {
        schema: {
            body: tagSchema,
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
                                    tag_name: { type: 'string' },
                                    user_id: { type: 'string' },
                                    mood_id: { type: 'integer' },
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
            const result = await tagService.saveTags(request.body);
            return result;
        } catch (error) {
            request.log.error(`Error al guardar etiquetas: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para obtener todas las etiquetas (protegida)
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
                            tag_name: { type: 'string' },
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
            const tagsList = await tagService.getAllTags({ limit, offset, moodId });
            return tagsList;
        } catch (error) {
            request.log.error(`Error al obtener etiquetas: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Ruta para obtener todas las etiquetas únicas
    fastify.get('/unique', {
        preHandler: [fastify.authenticate],
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const uniqueTags = await tagService.getUniqueTags();
            return uniqueTags;
        } catch (error) {
            request.log.error(`Error al obtener etiquetas únicas: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = routes; 