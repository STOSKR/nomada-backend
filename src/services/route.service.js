/**
 * Servicio para la gestión de rutas de viaje
 */
const PlaceService = require('./place.service');

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
      featured
    } = filters;

    try {
      // Consulta base para las rutas
      let query = this.supabase
        .from('routes')
        .select(`
          id,
          title,
          is_public,
          likes_count,
          saved_count,
          comments_count,
          cover_image,
          created_at,
          updated_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      // Filtrado por usuario
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Si no es un usuario específico, mostrar solo rutas públicas
        query = query.eq('is_public', true);
      }

      // Filtrado por destacadas (más likes)
      if (featured) {
        query = query.order('likes_count', { ascending: false });
      }

      // Aplicar paginación
      query = query.range(offset, offset + limit - 1);

      // Ejecutar la consulta
      const { data: routes, error } = await query;

      if (error) {
        console.error('Error al obtener rutas:', error);
        throw new Error(`Error al obtener las rutas: ${error.message}`);
      }

      // Si no hay rutas, devolver array vacío
      if (!routes || routes.length === 0) {
        return [];
      }

      // Obtener información de los usuarios de cada ruta en una sola consulta
      const userIds = [...new Set(routes.map(route => route.user_id))];

      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error al obtener usuarios:', usersError);
        // Continuar sin información de usuario
      }

      // Crear un mapa de usuarios para acceso rápido
      const userMap = {};
      if (users) {
        users.forEach(user => {
          userMap[user.id] = user;
        });
      }

      // Añadir la información de usuario a cada ruta
      const routesWithUsers = routes.map(route => ({
        ...route,
        user: userMap[route.user_id] || { id: route.user_id }
      }));

      return routesWithUsers;
    } catch (error) {
      console.error('Error completo al obtener rutas:', error);
      throw new Error(`Error al obtener las rutas: ${error.message}`);
    }
  }

  /**
   * Obtiene los detalles de una ruta específica
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario que solicita la información
   * @returns {Promise<Object>} - Detalles de la ruta
   */
  async getRouteDetail(routeId, userId) {
    try {
      // Obtener la información básica de la ruta
      const { data: route, error } = await this.supabase
        .from('routes')
        .select(`
          id,
          title,
          is_public,
          likes_count,
          saved_count,
          comments_count, 
          cover_image,
          user_id,
          created_at,
          updated_at
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

      // Obtener información del usuario creador
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .eq('id', route.user_id)
        .single();

      if (userError) {
        console.warn('No se pudo obtener información del creador:', userError);
        // Continuar sin info del usuario
      }

      // Obtener los lugares asociados a la ruta
      const { data: places, error: placesError } = await this.supabase
        .from('places')
        .select(`
          id,
          name,
          description,
          address,
          rating,
          coordinates,
          order_index,
          day_number,
          order_in_day,
          schedule,
          photos (
            id,
            public_url,
            caption,
            order_index
          )
        `)
        .eq('route_id', routeId)
        .order('day_number', { ascending: true })
        .order('order_in_day', { ascending: true });

      if (placesError) {
        console.error('Error al obtener los lugares de la ruta:', placesError);
        throw new Error('Error al obtener los lugares de la ruta');
      }

      // Formatear los horarios de los lugares
      const placeService = new PlaceService(this.supabase);
      const placesWithFormattedSchedules = places.map(place => ({
        ...place,
        formatted_schedule: placeService.formatSchedule(place.schedule)
      }));

      // Verificar si el usuario actual ha dado like a la ruta
      let isLiked = false;
      if (userId) {
        const { data: userLike, error: likeError } = await this.supabase
          .from('route_likes')
          .select('id')
          .eq('route_id', routeId)
          .eq('user_id', userId)
          .single();

        if (likeError && likeError.code !== 'PGRST116') { // PGRST116 es 'no se encontró ningún resultado'
          console.error('Error al verificar like:', likeError);
        } else {
          isLiked = !!userLike;
        }
      }

      // Agregar los lugares y el estado del like a la respuesta
      return {
        ...route,
        user: user || { id: route.user_id },
        places: placesWithFormattedSchedules || [],
        isLiked
      };
    } catch (error) {
      console.error('Error completo al obtener detalles de ruta:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva ruta de viaje
   * @param {Object} routeData - Datos de la ruta
   * @param {string} userId - ID del usuario creador
   * @returns {Promise<Object>} - Ruta creada
   */
  async createRoute(routeData, userId) {
    const { places = [], is_public = true, cover_image = null, title } = routeData;

    try {
      // Validación previa
      if (!userId) {
        throw new Error('Se requiere un usuario autenticado para crear una ruta');
      }

      if (!title) {
        throw new Error('El título de la ruta es obligatorio');
      }

      console.log('Intentando crear ruta con datos:', JSON.stringify({
        userId,
        title,
        is_public,
        cover_image,
        placesCount: places.length
      }));

      // 1. Crear la ruta
      const { data: route, error } = await this.supabase
        .from('routes')
        .insert({
          user_id: userId,
          title,
          is_public,
          cover_image,
          likes_count: 0,
          saved_count: 0,
          comments_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error al insertar la ruta en la BD:', error);
        throw new Error(`Error al crear la ruta: ${error.message || error.details || 'Error en la base de datos'}`);
      }

      if (!route || !route.id) {
        throw new Error('La ruta se creó pero no se pudo obtener su ID');
      }

      console.log('Ruta creada con ID:', route.id);

      // 2. Crear los lugares asociados a la ruta
      if (places.length > 0) {
        const placesToInsert = places.map((place, index) => {
          const {
            name,
            description = '',
            coordinates = null,
            address = null,
            rating = null,
            schedule = null,
            day_number = 1,
            order_in_day = index + 1
          } = place;

          if (!name) {
            console.warn(`Lugar en posición ${index} no tiene nombre`);
          }

          // Convertir coordenadas a un formato compatible con la BD
          let coordStr = null;
          if (coordinates && coordinates.lat && coordinates.lng) {
            coordStr = `(${coordinates.lat},${coordinates.lng})`;
          }

          return {
            route_id: route.id,
            name,
            description,
            coordinates: coordStr,
            address,
            rating,
            schedule,
            day_number,
            order_in_day,
            order_index: index + 1
          };
        });

        console.log(`Intentando insertar ${placesToInsert.length} lugares`);

        const { error: placesError } = await this.supabase
          .from('places')
          .insert(placesToInsert);

        if (placesError) {
          console.error('Error al insertar lugares:', placesError);

          // Si falla la inserción de lugares, eliminar la ruta creada
          const { error: deleteError } = await this.supabase
            .from('routes')
            .delete()
            .eq('id', route.id);

          if (deleteError) {
            console.error('Error adicional al intentar eliminar la ruta:', deleteError);
          }

          throw new Error(`Error al crear los lugares: ${placesError.message || placesError.details || 'Error en la base de datos'}`);
        }

        console.log('Lugares insertados correctamente');
      }

      return {
        success: true,
        message: 'Ruta creada exitosamente',
        route: {
          id: route.id
        }
      };
    } catch (error) {
      console.error('Error completo al crear ruta:', error);

      if (typeof error === 'object' && error.code) {
        console.error('Código de error:', error.code);
      }

      // Si el error ya está formateado como queremos, usarlo directamente
      if (error.success === false && error.message) {
        throw error;
      }

      throw {
        success: false,
        message: `Error al crear la ruta: ${error.message || 'Error desconocido'}`,
        error: error.toString()
      };
    }
  }

  /**
   * Actualiza una ruta existente
   * @param {string} routeId - ID de la ruta a actualizar
   * @param {Object} routeData - Datos actualizados
   * @param {string} userId - ID del usuario que realiza la actualización
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async updateRoute(routeId, routeData, userId) {
    try {
      // Verificar que la ruta existe y pertenece al usuario
      const { data: existingRoute, error: fetchError } = await this.supabase
        .from('routes')
        .select('id, user_id')
        .eq('id', routeId)
        .single();

      if (fetchError || !existingRoute) {
        throw new Error('Ruta no encontrada');
      }

      if (existingRoute.user_id !== userId) {
        throw new Error('No tienes permiso para actualizar esta ruta');
      }

      // Extraer campos permitidos para actualizar
      const { is_public, cover_image } = routeData;

      // Actualizar la ruta
      const { error: updateError } = await this.supabase
        .from('routes')
        .update({
          is_public,
          cover_image,
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: 'Ruta actualizada correctamente'
      };
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      throw error;
    }
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

  /**
   * Obtiene una ruta específica con todos sus lugares y fotos
   * @param {string} routeId - ID de la ruta
   * @param {string|null} userId - ID del usuario que solicita la ruta (o null si no está autenticado)
   * @returns {Promise<Object>} - Detalles de la ruta
   */
  async getRouteById(routeId, userId) {
    try {
      // Obtener la ruta
      const { data: route, error } = await this.supabase
        .from('routes')
        .select(`
          id,
          title,
          is_public,
          likes_count,
          saved_count,
          comments_count,
          cover_image,
          created_at,
          updated_at,
          user_id
        `)
        .eq('id', routeId)
        .single();

      if (error) {
        throw new Error('Ruta no encontrada');
      }

      // Si la ruta es privada y el usuario no es el propietario
      if (!route.is_public && (!userId || route.user_id !== userId)) {
        throw new Error('No tienes permiso para ver esta ruta');
      }

      // Obtener información del creador
      const { data: creator, error: creatorError } = await this.supabase
        .from('users')
        .select('id, username, avatar_url')
        .eq('id', route.user_id)
        .single();

      if (creatorError) {
        console.error('Error al obtener creador:', creatorError);
      }

      // Obtener lugares asociados a la ruta
      const { data: places, error: placesError } = await this.supabase
        .from('places')
        .select(`
          id,
          name,
          description,
          address,
          coordinates,
          order_index,
          day_number,
          order_in_day
        `)
        .eq('route_id', routeId)
        .order('day_number', { ascending: true })
        .order('order_in_day', { ascending: true });

      if (placesError) {
        console.error('Error al obtener lugares:', placesError);
      }

      // Verificar si el usuario ha dado like
      let isLiked = false;
      if (userId) {
        const { data: likeData, error: likeError } = await this.supabase
          .from('route_likes')
          .select('id')
          .eq('route_id', routeId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!likeError && likeData) {
          isLiked = true;
        }
      }

      // Combinar toda la información
      return {
        ...route,
        creator: creator || { id: route.user_id },
        places: places || [],
        isLiked
      };
    } catch (error) {
      console.error(`Error al obtener ruta ${routeId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene solo los lugares asociados a una ruta específica
   * @param {string} routeId - ID de la ruta
   * @param {string|null} userId - ID del usuario que solicita la información (o null si no está autenticado)
   * @returns {Promise<Object>} - Lugares de la ruta con sus fotos y horarios formateados
   */
  async getPlacesFromRoute(routeId, userId) {
    try {
      // Primero verificar si la ruta existe y si el usuario tiene permisos
      const { data: route, error: routeError } = await this.supabase
        .from('routes')
        .select('id, is_public, user_id')
        .eq('id', routeId)
        .single();

      if (routeError) {
        throw new Error('Ruta no encontrada');
      }

      // Verificar si el usuario tiene permiso para ver la ruta
      if (!route.is_public && (!userId || route.user_id !== userId)) {
        throw new Error('No tienes permiso para ver esta ruta');
      }

      // Obtener los lugares de la ruta
      const { data: places, error: placesError } = await this.supabase
        .from('places')
        .select(`
          id,
          name,
          description,
          address,
          coordinates,
          rating,
          day_number,
          order_in_day,
          schedule,
          photos (
            id,
            public_url,
            caption,
            order_index
          )
        `)
        .eq('route_id', routeId)
        .order('day_number', { ascending: true })
        .order('order_in_day', { ascending: true });

      if (placesError) {
        throw new Error('Error al obtener los lugares');
      }

      if (!places || places.length === 0) {
        return [];
      }

      // Obtener los detalles adicionales para cada lugar
      const placeService = new PlaceService(this.supabase);
      const placesWithDetails = await Promise.all(
        places.map(async (place) => {
          // Procesar el horario
          const formatted_schedule = placeService.formatSchedule(place.schedule);

          return {
            ...place,
            formatted_schedule
          };
        })
      );

      return placesWithDetails;
    } catch (error) {
      console.error('Error al obtener lugares de la ruta:', error);
      throw error;
    }
  }
}

module.exports = RouteService; 