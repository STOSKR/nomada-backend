'use strict';

/**
 * Ruta de prueba para verificar que la API está funcionando
 */
async function routes(fastify, options) {
    fastify.get('/api/test', {
        schema: {
            description: 'Ruta de prueba para verificar el estado de la API',
            tags: ['Testing'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        environment: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return {
            status: 'success',
            message: '¡API Nómada funcionando correctamente!',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };
    });
}

module.exports = routes; 