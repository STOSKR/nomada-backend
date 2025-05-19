'use strict';

const newsletterService = require('../services/newsletter.service');
const { isValidEmail } = require('../utils/validation');

/**
 * Rutas para el manejo de suscripciones al newsletter
 * @param {FastifyInstance} fastify Instancia de Fastify
 * @param {Object} options Opciones del plugin
 */
async function routes(fastify, options) {
    // Ruta para suscribirse al newsletter
    fastify.post('/subscribe', {
        schema: {
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email' }
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
        }
    }, async (request, reply) => {
        try {
            const { email } = request.body;

            // Validar formato de email
            if (!email || !isValidEmail(email)) {
                return reply.code(400).send({
                    success: false,
                    message: 'Formato de correo electrónico inválido'
                });
            }

            const result = await newsletterService.subscribeToNewsletter(email);

            if (!result.success) {
                return reply.code(409).send({
                    success: false,
                    message: result.message
                });
            }

            return {
                success: true,
                message: 'Suscripción al newsletter realizada correctamente'
            };
        } catch (error) {
            request.log.error(`Error al suscribirse al newsletter: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: 'Error al procesar la suscripción'
            });
        }
    });

    // Ruta para darse de baja del newsletter
    fastify.post('/unsubscribe', {
        schema: {
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email' }
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
        }
    }, async (request, reply) => {
        try {
            const { email } = request.body;

            // Validar formato de email
            if (!email || !isValidEmail(email)) {
                return reply.code(400).send({
                    success: false,
                    message: 'Formato de correo electrónico inválido'
                });
            }

            const result = await newsletterService.unsubscribe(email);

            return {
                success: result.success,
                message: result.success
                    ? 'Te has dado de baja del newsletter correctamente'
                    : result.message
            };
        } catch (error) {
            request.log.error(`Error al darse de baja del newsletter: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: 'Error al procesar la baja'
            });
        }
    });

    // Ruta para obtener todos los suscriptores (protegida con autenticación)
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
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    email: { type: 'string' },
                                    subscribed_at: { type: 'string' },
                                    unsubscribed_at: { type: ['string', 'null'] },
                                    is_active: { type: 'boolean' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { limit, offset } = request.query;
            const subscribers = await newsletterService.getAllSubscribers({ limit, offset });

            return {
                success: true,
                data: subscribers
            };
        } catch (error) {
            request.log.error(`Error al obtener suscriptores: ${error.message}`);
            return reply.code(500).send({
                success: false,
                message: 'Error al obtener suscriptores'
            });
        }
    });
}

module.exports = routes; 