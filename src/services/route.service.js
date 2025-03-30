/**
 * Servicio para la gestión de rutas de viaje
 */
class RouteService {
  /**
   * Constructor
   * @param {Object} supabase - Cliente de Supabase
   */
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Obtiene rutas con filtros
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise<Array>} - Lista de rutas
   */
  async getRoutes(filters = {}) {
    const {
      limit = 20,
      offset = 0,
      userId,
      featured,
      country,
      tag
    } = filters;

    let query = this.supabase
      .from('routes')
      .select(`
        id,
        title,
        description,
        country,
        is_public,
        likes_count,
        created_at,
        user:user_id (
          id, 
          username,
          full_name
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrado por usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filtrado por país
    if (country) {
      query = query.eq('country', country);
    }

    // Filtrado por destacadas (más likes)
    if (featured) {
      query = query.order('likes_count', { ascending: false });
    }

    // Filtrado por etiqueta
    if (tag) {
      // Buscar rutas que contengan la etiqueta en su array de tags
      query = query.contains('tags', [tag]);
    }

    const { data: routes, error } = await query;

    if (error) {
      console.error('Error al obtener rutas:', error);
      throw new Error('Error al obtener las rutas');
    }

    return routes || [];
  }

  /**
   * Obtiene los detalles de una ruta específica
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario que solicita la información
   * @returns {Promise<Object>} - Detalles de la ruta
   */
  async getRouteDetail(routeId, userId) {
    // Obtener la información básica de la ruta
    const { data: route, error } = await this.supabase
      .from('routes')
      .select(`
        id,
        title,
        description,
        country,
        is_public,
        user_id,
        likes_count,
        created_at,
        user:user_id (
          id, 
          username,
          full_name
        )
      `)
      .eq('id', routeId)
      .single();

    if (error || !route) {
      console.error('Error al obtener la ruta:', error);
      throw new Error('Ruta no encontrada');
    }

    // Verificar permisos: si la ruta es privada, solo el propietario puede verla
    if (!route.is_public && route.user_id !== userId) {
      throw new Error('No tienes permiso para ver esta ruta');
    }

    // Obtener los lugares asociados a la ruta
    const { data: places, error: placesError } = await this.supabase
      .from('places')
      .select(`
        id,
        name,
        description,
        coordinates,
        order_index,
        photos (
          id,
          public_url,
          caption,
          order_index
        )
      `)
      .eq('route_id', routeId)
      .order('order_index', { ascending: true });

    if (placesError) {
      console.error('Error al obtener los lugares de la ruta:', placesError);
      throw new Error('Error al obtener los lugares de la ruta');
    }

    // Verificar si el usuario actual ha dado like a la ruta
    const { data: userLike, error: likeError } = await this.supabase
      .from('route_likes')
      .select('id')
      .eq('route_id', routeId)
      .eq('user_id', userId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') { // PGRST116 es 'no se encontró ningún resultado'
      console.error('Error al verificar like:', likeError);
    }

    // Agregar los lugares y el estado del like a la respuesta
    return {
      ...route,
      places: places || [],
      isLiked: !!userLike
    };
  }

  /**
   * Crea una nueva ruta de viaje
   * @param {Object} routeData - Datos de la ruta
   * @param {string} userId - ID del usuario creador
   * @returns {Promise<Object>} - Ruta creada
   */
  async createRoute(routeData, userId) {
    // Extraer los lugares para insertarlos por separado
    const { places = [], ...routeInfo } = routeData;

    // Iniciar una transacción
    const { data: route, error } = await this.supabase
      .from('routes')
      .insert({
        ...routeInfo,
        user_id: userId
      })
      .select('id, title')
      .single();

    if (error) {
      console.error('Error al crear la ruta:', error);
      throw new Error('Error al crear la ruta: ' + error.message);
    }

    // Si hay lugares que agregar, hacerlo en lote
    if (places.length > 0) {
      const placesToInsert = places.map((place, index) => ({
        ...place,
        coordinates: place.coordinates ? JSON.stringify(place.coordinates) : null,
        order_index: place.order_index !== undefined ? place.order_index : index,
        route_id: route.id
      }));

      const { error: placesError } = await this.supabase
        .from('places')
        .insert(placesToInsert);

      if (placesError) {
        console.error('Error al crear los lugares:', placesError);
        throw new Error('Se creó la ruta pero hubo un error al agregar los lugares');
      }
    }

    return route;
  }

  /**
   * Actualiza una ruta de viaje existente
   * @param {string} routeId - ID de la ruta a actualizar
   * @param {Object} routeData - Nuevos datos de la ruta
   * @param {string} userId - ID del usuario que realiza la actualización
   * @returns {Promise<Object>} - Resultado de la actualización
   */
  async updateRoute(routeId, routeData, userId) {
    // Verificar que la ruta exista y pertenezca al usuario
    const { data: existingRoute, error: checkError } = await this.supabase
      .from('routes')
      .select('id, user_id')
      .eq('id', routeId)
      .single();

    if (checkError || !existingRoute) {
      console.error('Error al verificar la ruta:', checkError);
      throw new Error('Ruta no encontrada');
    }

    if (existingRoute.user_id !== userId) {
      throw new Error('No tienes permiso para modificar esta ruta');
    }

    // Actualizar la ruta
    const { error: updateError } = await this.supabase
      .from('routes')
      .update(routeData)
      .eq('id', routeId);

    if (updateError) {
      console.error('Error al actualizar la ruta:', updateError);
      throw new Error('Error al actualizar la ruta: ' + updateError.message);
    }

    return { id: routeId };
  }

  /**
   * Elimina una ruta de viaje
   * @param {string} routeId - ID de la ruta a eliminar
   * @param {string} userId - ID del usuario que solicita la eliminación
   * @returns {Promise<void>}
   */
  async deleteRoute(routeId, userId) {
    // Verificar que la ruta exista y pertenezca al usuario
    const { data: existingRoute, error: checkError } = await this.supabase
      .from('routes')
      .select('id, user_id')
      .eq('id', routeId)
      .single();

    if (checkError || !existingRoute) {
      console.error('Error al verificar la ruta:', checkError);
      throw new Error('Ruta no encontrada');
    }

    if (existingRoute.user_id !== userId) {
      throw new Error('No tienes permiso para eliminar esta ruta');
    }

    // Eliminar la ruta (en cascada se eliminarán los lugares y fotos)
    const { error: deleteError } = await this.supabase
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (deleteError) {
      console.error('Error al eliminar la ruta:', deleteError);
      throw new Error('Error al eliminar la ruta');
    }
  }

  /**
   * Da like a una ruta
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario que da like
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async likeRoute(routeId, userId) {
    // Verificar que la ruta exista
    const { data: route, error: routeError } = await this.supabase
      .from('routes')
      .select('id')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      console.error('Error al verificar la ruta:', routeError);
      throw new Error('Ruta no encontrada');
    }

    // Verificar si ya dio like
    const { data: existingLike, error: likeCheckError } = await this.supabase
      .from('route_likes')
      .select('id')
      .eq('route_id', routeId)
      .eq('user_id', userId)
      .single();

    // Si ya dio like, no hacer nada
    if (existingLike) {
      return { message: 'Ya has dado like a esta ruta' };
    }

    // Insertar el like
    const { error: insertError } = await this.supabase
      .from('route_likes')
      .insert({
        route_id: routeId,
        user_id: userId
      });

    if (insertError) {
      console.error('Error al dar like:', insertError);
      throw new Error('Error al dar like a la ruta');
    }

    return { message: 'Like agregado correctamente' };
  }

  /**
   * Quita like de una ruta
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario que quita el like
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async unlikeRoute(routeId, userId) {
    // Eliminar el like si existe
    const { error } = await this.supabase
      .from('route_likes')
      .delete()
      .eq('route_id', routeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error al quitar like:', error);
      throw new Error('Error al quitar like de la ruta');
    }

    return { message: 'Like eliminado correctamente' };
  }

  /**
   * Obtiene los usuarios que dieron like a una ruta
   * @param {string} routeId - ID de la ruta
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Desplazamiento para paginación
   * @returns {Promise<Array>} - Lista de usuarios
   */
  async getRouteLikes(routeId, limit = 20, offset = 0) {
    const { data, error } = await this.supabase
      .from('route_likes')
      .select(`
        user:user_id (
          id,
          username,
          full_name
        )
      `)
      .eq('route_id', routeId)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error al obtener likes:', error);
      throw new Error('Error al obtener likes de la ruta');
    }

    // Transformar el resultado para obtener solo la información del usuario
    return data ? data.map(item => item.user) : [];
  }
}

module.exports = RouteService; 