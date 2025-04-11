/**
 * Rutas para gestionar lugares dentro de rutas de viaje
 */
const PlaceService = require('../services/place.service');

/**
 * Esquemas para validación y documentación
 */
const schemas = {
    // Esquema para obtener un lugar específico
    getPlace: {
        description: 'Obtener detalles de un lugar',
        tags: ['lugares'],
        security: [{ apiKey: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    coordinates: { type: 'string' },
                    address: { type: 'string' },
                    rating: { type: 'number' },
                    formatted_schedule: { type: 'string' },
                    schedule: { type: 'object' },
                    order_in_day: { type: 'integer' },
                    day_number: { type: 'integer' },
                    order_index: { type: 'integer' },
                    route_id: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    photos: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                public_url: { type: 'string' },
                                caption: { type: 'string' },
                                order_index: { type: 'integer' }
                            }
                        }
                    }
                }
            }
        }
    },

    // Esquema para crear un lugar
    createPlace: {
        description: 'Agregar un nuevo lugar a una ruta',
        tags: ['lugares'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['route_id', 'name'],
            properties: {
                route_id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                coordinates: {
                    type: 'object',
                    properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                    }
                },
                order_index: { type: 'integer' }
            }
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    place: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' }
                        }
                    }
                }
            }
        }
    },

    // Esquema para actualizar un lugar
    updatePlace: {
        description: 'Actualizar información de un lugar',
        tags: ['lugares'],
        security: [{ apiKey: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' }
            }
        },
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                coordinates: {
                    type: 'object',
                    properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                    }
                },
                order_index: { type: 'integer' }
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
    },

    // Esquema para eliminar un lugar
    deletePlace: {
        description: 'Eliminar un lugar de una ruta',
        tags: ['lugares'],
        security: [{ apiKey: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' }
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
    },

    // Esquema para agregar foto a un lugar
    addPhoto: {
        description: 'Agregar foto a un lugar',
        tags: ['lugares', 'fotos'],
        security: [{ apiKey: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' }
            }
        },
        body: {
            type: 'object',
            required: ['photo_id'],
            properties: {
                photo_id: { type: 'string' },
                caption: { type: 'string' },
                order_index: { type: 'integer' }
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
    },

    // Esquema para eliminar foto de un lugar
    removePhoto: {
        description: 'Eliminar foto de un lugar',
        tags: ['lugares', 'fotos'],
        security: [{ apiKey: [] }],
        params: {
            type: 'object',
            required: ['id', 'photoId'],
            properties: {
                id: { type: 'string' },
                photoId: { type: 'string' }
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
    },

    // Esquema para actualizar orden de lugares
    updatePlacesOrder: {
        description: 'Actualizar el orden de lugares en una ruta',
        tags: ['lugares'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            required: ['route_id', 'places'],
            properties: {
                route_id: { type: 'string' },
                places: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['id', 'order_index'],
                        properties: {
                            id: { type: 'string' },
                            order_index: { type: 'integer' }
                        }
                    }
                }
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
};

/**
 * Plugin de Fastify para rutas de lugares
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function placeRoutes(fastify, options) {
    // Instancia del servicio de lugares
    const placeService = new PlaceService(fastify.supabase);

    // Obtener un lugar específico con sus fotos
    fastify.get('/:id', {
        schema: schemas.getPlace,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user?.id;

            const place = await placeService.getPlaceWithPhotos(id, userId);

            // Añadir horario formateado
            place.formatted_schedule = placeService.formatSchedule(place.schedule);

            return reply.code(200).send(place);
        } catch (error) {
            request.log.error(error);
            return reply.code(error.statusCode || 500).send({
                message: error.message
            });
        }
    });

    // Crear un nuevo lugar
    fastify.post('/', {
        schema: schemas.createPlace,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const placeData = request.body;

            const place = await placeService.createPlace(placeData, userId);

            return reply.code(201).send({
                success: true,
                message: 'Lugar creado correctamente',
                place: {
                    id: place.id,
                    name: place.name
                }
            });
        } catch (error) {
            request.log.error(error);

            if (error.message.includes('No tienes permiso')) {
                return reply.code(403).send({
                    success: false,
                    message: error.message
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Actualizar un lugar existente
    fastify.put('/:id', {
        schema: schemas.updatePlace,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const placeId = request.params.id;
            const placeData = request.body;

            await placeService.updatePlace(placeId, placeData, userId);

            return {
                success: true,
                message: 'Lugar actualizado correctamente'
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Lugar no encontrado') {
                return reply.code(404).send({
                    success: false,
                    message: 'Lugar no encontrado'
                });
            }

            if (error.message.includes('No tienes permiso')) {
                return reply.code(403).send({
                    success: false,
                    message: error.message
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Eliminar un lugar
    fastify.delete('/:id', {
        schema: schemas.deletePlace,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const placeId = request.params.id;

            await placeService.deletePlace(placeId, userId);

            return {
                success: true,
                message: 'Lugar eliminado correctamente'
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Lugar no encontrado') {
                return reply.code(404).send({
                    success: false,
                    message: 'Lugar no encontrado'
                });
            }

            if (error.message.includes('No tienes permiso')) {
                return reply.code(403).send({
                    success: false,
                    message: error.message
                });
            }

            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Agregar foto a un lugar
    fastify.post('/:id/photos', {
        schema: schemas.addPhoto,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const placeId = request.params.id;
            const photoData = request.body;

            await placeService.addPhotoToPlace(placeId, photoData, userId);

            return {
                success: true,
                message: 'Foto agregada correctamente'
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Lugar no encontrado') {
                return reply.code(404).send({
                    success: false,
                    message: 'Lugar no encontrado'
                });
            }

            if (error.message.includes('No tienes permiso')) {
                return reply.code(403).send({
                    success: false,
                    message: error.message
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });

    // Eliminar foto de un lugar
    fastify.delete('/:id/photos/:photoId', {
        schema: schemas.removePhoto,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const placeId = request.params.id;
            const photoId = request.params.photoId;

            await placeService.removePhotoFromPlace(placeId, photoId, userId);

            return {
                success: true,
                message: 'Foto eliminada correctamente'
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Foto no encontrada' || error.message === 'Lugar no encontrado') {
                return reply.code(404).send({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('No tienes permiso')) {
                return reply.code(403).send({
                    success: false,
                    message: error.message
                });
            }

            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    });

    // Actualizar el orden de lugares en una ruta
    fastify.put('/order', {
        schema: schemas.updatePlacesOrder,
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { route_id, places } = request.body;

            await placeService.updatePlacesOrder(route_id, places, userId);

            return {
                success: true,
                message: 'Orden de lugares actualizado correctamente'
            };
        } catch (error) {
            request.log.error(error);

            if (error.message === 'Ruta no encontrada') {
                return reply.code(404).send({
                    success: false,
                    message: 'Ruta no encontrada'
                });
            }

            if (error.message.includes('No tienes permiso')) {
                return reply.code(403).send({
                    success: false,
                    message: error.message
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    });
}

module.exports = placeRoutes; 