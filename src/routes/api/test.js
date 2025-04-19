'use strict';

/**
 * Rutas de prueba para verificar que el API funciona correctamente
 */
module.exports = async function (fastify, options) {
    // Ruta para comprobar que la API está funcionando
    fastify.get('/api-health', async (request, reply) => {
        return {
            success: true,
            message: 'API funcionando correctamente',
            timestamp: new Date().toISOString()
        };
    });

    // Ruta específica para probar la ruta problemática
    fastify.get('/test-routes-all', async (request, reply) => {
        try {
            // Redireccionar a la ruta original
            return reply.redirect('/routes/all');
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: 'Error al redirigir a la ruta /routes/all',
                error: error.message
            });
        }
    });
}; 