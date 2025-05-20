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
        required: ['tags', 'userId'],
        properties: {
            tags: {
                type: 'array',
                items: { type: 'string' }
            },
            userId: { type: 'string' },
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
}

module.exports = routes; 