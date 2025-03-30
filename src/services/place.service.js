/**
 * Servicio para la gestión de lugares en rutas de viaje
 */
class PlaceService {
    /**
     * Constructor
     * @param {Object} supabase - Cliente de Supabase
     */
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Obtiene un lugar con sus fotos
     * @param {string} placeId - ID del lugar
     * @param {string} userId - ID del usuario solicitante
     * @returns {Promise<Object>} - Detalles del lugar con fotos
     */
    async getPlaceWithPhotos(placeId, userId) {
        // Obtener el lugar
        const { data: place, error } = await this.supabase
            .from('places')
            .select(`
        id,
        name,
        description,
        coordinates,
        order_index,
        route_id,
        created_at
      `)
            .eq('id', placeId)
            .single();

        if (error || !place) {
            console.error('Error al obtener lugar:', error);
            throw new Error('Lugar no encontrado');
        }

        // Verificar permisos a través de la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id, is_public')
            .eq('id', place.route_id)
            .single();

        if (routeError) {
            console.error('Error al verificar permisos de ruta:', routeError);
            throw new Error('Error al verificar permisos');
        }

        // Si la ruta es privada, verificar que el usuario sea el propietario
        if (!route.is_public && route.user_id !== userId) {
            throw new Error('No tienes permiso para ver este lugar');
        }

        // Obtener las fotos asociadas al lugar
        const { data: photos, error: photosError } = await this.supabase
            .from('photos')
            .select(`
        id,
        public_url,
        caption,
        order_index
      `)
            .eq('place_id', placeId)
            .order('order_index', { ascending: true });

        if (photosError) {
            console.error('Error al obtener fotos:', photosError);
            throw new Error('Error al obtener las fotos del lugar');
        }

        // Combinar lugar con sus fotos
        return {
            ...place,
            photos: photos || []
        };
    }

    /**
     * Crea un nuevo lugar en una ruta
     * @param {Object} placeData - Datos del lugar
     * @param {string} userId - ID del usuario creador
     * @returns {Promise<Object>} - Lugar creado
     */
    async createPlace(placeData, userId) {
        const { route_id, coordinates, ...otherData } = placeData;

        // Verificar permisos para la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id')
            .eq('id', route_id)
            .single();

        if (routeError || !route) {
            console.error('Error al verificar ruta:', routeError);
            throw new Error('Ruta no encontrada');
        }

        // Verificar que el usuario sea el propietario de la ruta
        if (route.user_id !== userId) {
            throw new Error('No tienes permiso para agregar lugares a esta ruta');
        }

        // Obtener el último índice de orden para los lugares de esta ruta
        const { data: lastPlace, error: orderError } = await this.supabase
            .from('places')
            .select('order_index')
            .eq('route_id', route_id)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        // Determinar el nuevo orden (último + 1 o 0 si no hay lugares)
        const nextOrderIndex = lastPlace ? lastPlace.order_index + 1 : 0;

        // Crear el lugar
        const { data: place, error } = await this.supabase
            .from('places')
            .insert({
                route_id,
                coordinates: coordinates ? JSON.stringify(coordinates) : null,
                order_index: otherData.order_index !== undefined ? otherData.order_index : nextOrderIndex,
                ...otherData
            })
            .select('id, name')
            .single();

        if (error) {
            console.error('Error al crear lugar:', error);
            throw new Error('Error al crear el lugar: ' + error.message);
        }

        return place;
    }

    /**
     * Actualiza un lugar existente
     * @param {string} placeId - ID del lugar a actualizar
     * @param {Object} placeData - Nuevos datos del lugar
     * @param {string} userId - ID del usuario que realiza la actualización
     * @returns {Promise<void>}
     */
    async updatePlace(placeId, placeData, userId) {
        // Verificar que el lugar exista y obtener su ruta
        const { data: place, error: placeError } = await this.supabase
            .from('places')
            .select('route_id')
            .eq('id', placeId)
            .single();

        if (placeError || !place) {
            console.error('Error al verificar lugar:', placeError);
            throw new Error('Lugar no encontrado');
        }

        // Verificar permisos para la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id')
            .eq('id', place.route_id)
            .single();

        if (routeError) {
            console.error('Error al verificar ruta:', routeError);
            throw new Error('Error al verificar permisos');
        }

        // Verificar que el usuario sea el propietario de la ruta
        if (route.user_id !== userId) {
            throw new Error('No tienes permiso para modificar este lugar');
        }

        // Preparar datos para actualización
        const updateData = { ...placeData };

        // Convertir coordenadas a formato string si existen
        if (updateData.coordinates) {
            updateData.coordinates = JSON.stringify(updateData.coordinates);
        }

        // Actualizar el lugar
        const { error } = await this.supabase
            .from('places')
            .update(updateData)
            .eq('id', placeId);

        if (error) {
            console.error('Error al actualizar lugar:', error);
            throw new Error('Error al actualizar el lugar: ' + error.message);
        }
    }

    /**
     * Elimina un lugar de una ruta
     * @param {string} placeId - ID del lugar a eliminar
     * @param {string} userId - ID del usuario que solicita la eliminación
     * @returns {Promise<void>}
     */
    async deletePlace(placeId, userId) {
        // Verificar que el lugar exista y obtener su ruta
        const { data: place, error: placeError } = await this.supabase
            .from('places')
            .select('route_id')
            .eq('id', placeId)
            .single();

        if (placeError || !place) {
            console.error('Error al verificar lugar:', placeError);
            throw new Error('Lugar no encontrado');
        }

        // Verificar permisos para la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id')
            .eq('id', place.route_id)
            .single();

        if (routeError) {
            console.error('Error al verificar ruta:', routeError);
            throw new Error('Error al verificar permisos');
        }

        // Verificar que el usuario sea el propietario de la ruta
        if (route.user_id !== userId) {
            throw new Error('No tienes permiso para eliminar este lugar');
        }

        // Eliminar el lugar (las fotos se eliminarán por cascada)
        const { error } = await this.supabase
            .from('places')
            .delete()
            .eq('id', placeId);

        if (error) {
            console.error('Error al eliminar lugar:', error);
            throw new Error('Error al eliminar el lugar');
        }
    }

    /**
     * Agrega una foto a un lugar
     * @param {string} placeId - ID del lugar
     * @param {Object} photoData - Datos de la foto
     * @param {string} userId - ID del usuario que realiza la acción
     * @returns {Promise<void>}
     */
    async addPhotoToPlace(placeId, photoData, userId) {
        const { photo_id, caption, order_index } = photoData;

        // Verificar que el lugar exista y obtener su ruta
        const { data: place, error: placeError } = await this.supabase
            .from('places')
            .select('route_id')
            .eq('id', placeId)
            .single();

        if (placeError || !place) {
            console.error('Error al verificar lugar:', placeError);
            throw new Error('Lugar no encontrado');
        }

        // Verificar permisos para la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id')
            .eq('id', place.route_id)
            .single();

        if (routeError) {
            console.error('Error al verificar ruta:', routeError);
            throw new Error('Error al verificar permisos');
        }

        // Verificar que el usuario sea el propietario de la ruta
        if (route.user_id !== userId) {
            throw new Error('No tienes permiso para agregar fotos a este lugar');
        }

        // Verificar que la foto exista y pertenezca al usuario
        const { data: photo, error: photoError } = await this.supabase
            .from('photos')
            .select('id, user_id')
            .eq('id', photo_id)
            .single();

        if (photoError || !photo) {
            console.error('Error al verificar foto:', photoError);
            throw new Error('Foto no encontrada');
        }

        // Verificar que la foto pertenezca al usuario
        if (photo.user_id !== userId) {
            throw new Error('No tienes permiso para usar esta foto');
        }

        // Determinar el orden de la foto (si no se proporciona)
        let newOrderIndex = order_index;

        if (newOrderIndex === undefined) {
            const { data: lastPhoto, error: orderError } = await this.supabase
                .from('photos')
                .select('order_index')
                .eq('place_id', placeId)
                .order('order_index', { ascending: false })
                .limit(1)
                .single();

            newOrderIndex = lastPhoto ? lastPhoto.order_index + 1 : 0;
        }

        // Asociar la foto al lugar
        const { error } = await this.supabase
            .from('photos')
            .update({
                place_id: placeId,
                caption: caption || null,
                order_index: newOrderIndex
            })
            .eq('id', photo_id);

        if (error) {
            console.error('Error al asociar foto al lugar:', error);
            throw new Error('Error al agregar la foto al lugar');
        }
    }

    /**
     * Elimina una foto de un lugar
     * @param {string} placeId - ID del lugar
     * @param {string} photoId - ID de la foto
     * @param {string} userId - ID del usuario que realiza la acción
     * @returns {Promise<void>}
     */
    async removePhotoFromPlace(placeId, photoId, userId) {
        // Verificar que el lugar exista y obtener su ruta
        const { data: place, error: placeError } = await this.supabase
            .from('places')
            .select('route_id')
            .eq('id', placeId)
            .single();

        if (placeError || !place) {
            console.error('Error al verificar lugar:', placeError);
            throw new Error('Lugar no encontrado');
        }

        // Verificar permisos para la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id')
            .eq('id', place.route_id)
            .single();

        if (routeError) {
            console.error('Error al verificar ruta:', routeError);
            throw new Error('Error al verificar permisos');
        }

        // Verificar que el usuario sea el propietario de la ruta
        if (route.user_id !== userId) {
            throw new Error('No tienes permiso para eliminar fotos de este lugar');
        }

        // Verificar que la foto exista y esté asociada al lugar
        const { data: photo, error: photoError } = await this.supabase
            .from('photos')
            .select('id')
            .eq('id', photoId)
            .eq('place_id', placeId)
            .single();

        if (photoError || !photo) {
            console.error('Error al verificar foto:', photoError);
            throw new Error('Foto no encontrada en este lugar');
        }

        // Eliminar la asociación entre foto y lugar (no eliminar la foto)
        const { error } = await this.supabase
            .from('photos')
            .update({
                place_id: null,
                caption: null,
                order_index: null
            })
            .eq('id', photoId);

        if (error) {
            console.error('Error al desasociar foto:', error);
            throw new Error('Error al eliminar la foto del lugar');
        }
    }

    /**
     * Actualiza el orden de lugares en una ruta
     * @param {string} routeId - ID de la ruta
     * @param {Array} places - Array de objetos {id, order_index}
     * @param {string} userId - ID del usuario que realiza la acción
     * @returns {Promise<void>}
     */
    async updatePlacesOrder(routeId, places, userId) {
        // Verificar permisos para la ruta
        const { data: route, error: routeError } = await this.supabase
            .from('routes')
            .select('user_id')
            .eq('id', routeId)
            .single();

        if (routeError || !route) {
            console.error('Error al verificar ruta:', routeError);
            throw new Error('Ruta no encontrada');
        }

        // Verificar que el usuario sea el propietario de la ruta
        if (route.user_id !== userId) {
            throw new Error('No tienes permiso para modificar esta ruta');
        }

        // Actualizar el orden de cada lugar
        for (const place of places) {
            const { error } = await this.supabase
                .from('places')
                .update({ order_index: place.order_index })
                .eq('id', place.id)
                .eq('route_id', routeId); // Asegurarse de que el lugar pertenezca a la ruta

            if (error) {
                console.error(`Error al actualizar orden de lugar ${place.id}:`, error);
                throw new Error('Error al actualizar el orden de los lugares');
            }
        }
    }
}

module.exports = PlaceService; 