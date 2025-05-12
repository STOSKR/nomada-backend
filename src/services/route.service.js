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
          user_id,
          country
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
          description,
          is_public,
          likes_count,
          saved_count,
          comments_count, 
          cover_image,
          user_id,
          created_at,
          updated_at,
          country
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

      // Obtener fotos de la ruta
      const { data: routePhotos, error: photosError } = await this.supabase
        .from('route_photos')
        .select('id, public_url, caption, order_index')
        .eq('route_id', routeId)
        .order('order_index', { ascending: true });

      if (photosError) {
        console.warn('Error al obtener fotos de la ruta:', photosError);
        // Continuar sin las fotos
      }

      // Obtener información del usuario creador
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('id, username, avatar_url, nomada_id')
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
        photos: routePhotos || [],    // Agregamos la colección de fotos
        places: placesWithFormattedSchedules || [],
        isLiked
      };
    } catch (error) {
      console.error('Error completo al obtener detalles de ruta:', error);
      throw error;
    }
  }

  /**
   * Obtiene el país a partir de coordenadas usando la API de OpenStreetMap
   * @param {Object} coordinates - Coordenadas {lat, lng}
   * @returns {Promise<string>} - Nombre del país
   */
  async getCountryFromCoordinates(coordinates) {
    try {
      // Validación más estricta de coordenadas
      if (!coordinates ||
        typeof coordinates !== 'object' ||
        typeof coordinates.lat !== 'number' ||
        typeof coordinates.lng !== 'number' ||
        isNaN(coordinates.lat) ||
        isNaN(coordinates.lng)) {
        console.warn('Coordenadas inválidas:', coordinates);
        return null;
      }

      // Validar rango de coordenadas
      if (coordinates.lat < -90 || coordinates.lat > 90 ||
        coordinates.lng < -180 || coordinates.lng > 180) {
        console.warn('Coordenadas fuera de rango:', coordinates);
        return null;
      }

      console.log('Realizando geocodificación inversa para:', coordinates);

      // Agregar un User-Agent para cumplir con los términos de uso de Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&format=json&accept-language=es`,
        {
          headers: {
            'User-Agent': 'NomadaApp/1.0',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('Error en la respuesta de Nominatim:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('Respuesta de Nominatim:', JSON.stringify(data));

      // Intentar obtener el país de diferentes maneras
      const country = data.address?.country ||
        data.address?.country_name ||
        data.country;

      if (!country) {
        console.warn('No se pudo encontrar el país en la respuesta:', data);
        return null;
      }

      console.log(`País detectado para coordenadas (${coordinates.lat}, ${coordinates.lng}):`, country);

      return country;
    } catch (error) {
      console.error('Error al obtener país desde coordenadas:', error);
      return null;
    }
  }

  /**
   * Crea una nueva ruta de viaje
   * @param {Object} routeData - Datos de la ruta
   * @param {string} userId - ID del usuario creador
   * @returns {Promise<Object>} - Ruta creada
   */
  async createRoute(routeData, userId) {
    const {
      places = [],
      is_public = true,
      cover_image = null,
      description = '',
      photos = [],
      title
    } = routeData;

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
        description,
        is_public,
        cover_image,
        photos: photos.length,
        placesCount: places.length
      }));

      // Determinar el país basado en el primer lugar si tiene coordenadas
      let country = null;
      if (places.length > 0) {
        console.log('Primer lugar:', JSON.stringify(places[0]));

        let coordinates = places[0].coordinates;

        // Si las coordenadas vienen como string, convertirlas a objeto
        if (typeof coordinates === 'string') {
          try {
            // Intentar extraer lat y lng del formato "(lat,lng)"
            const match = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
            if (match) {
              coordinates = {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
              };
            }
          } catch (error) {
            console.error('Error al parsear coordenadas:', error);
          }
        }

        console.log('Coordenadas procesadas:', coordinates);

        if (coordinates && typeof coordinates === 'object') {
          try {
            country = await this.getCountryFromCoordinates(coordinates);
            console.log('País detectado:', country);
          } catch (error) {
            console.error('Error al obtener país:', error);
          }
        } else {
          console.warn('Coordenadas no válidas en el primer lugar');
        }
      }

      // 1. Crear la ruta
      const routeInsert = {
        user_id: userId,
        title: routeData.title,
        description: routeData.description,
        is_public: routeData.is_public !== undefined ? routeData.is_public : true,
        cover_image: routeData.cover_image,
        // Añadir explícitamente los conteos calculados
        days_count: routeData.days_count || 1,
        places_count: routeData.places_count || 0
      };

      // Solo agregar country si se detectó uno
      if (country) {
        routeInsert.country = country;
      }

      console.log('Datos a insertar en la ruta:', routeInsert);

      const { data: newRoute, error } = await this.supabase
        .from('routes')
        .insert(routeInsert)
        .select('id, created_at')
        .single();

      if (error) {
        console.error('Error al insertar la ruta en la BD:', error);
        throw new Error(`Error al crear la ruta: ${error.message || error.details || 'Error en la base de datos'}`);
      }

      if (!newRoute || !newRoute.id) {
        throw new Error('La ruta se creó pero no se pudo obtener su ID');
      }

      console.log('Ruta creada con ID:', newRoute.id);

      // 2. Añadir las fotos de la ruta (URLs de Cloudinary)
      if (photos && photos.length > 0) {
        const routePhotos = photos.map((photo, index) => {
          return {
            route_id: newRoute.id,
            public_url: photo.url,         // URL de Cloudinary
            caption: photo.caption || '',
            order_index: index + 1
          };
        });

        const { error: photosError } = await this.supabase
          .from('route_photos')
          .insert(routePhotos);

        if (photosError) {
          console.error('Error al añadir fotos a la ruta:', photosError);
          // Continuar con la creación aunque haya problemas con las fotos
        } else {
          console.log(`${routePhotos.length} fotos añadidas a la ruta`);
        }
      }

      // 3. Crear los lugares asociados a la ruta
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
            order_in_day = index + 1,
            photos = []  // Fotos del lugar (URLs de Cloudinary)
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
            route_id: newRoute.id,
            name,
            description,
            coordinates: coordStr,
            address,
            rating,
            schedule,
            day_number,
            order_in_day,
            order_index: index + 1,
            photos: photos  // Guardaremos las fotos después
          };
        });

        console.log(`Intentando insertar ${placesToInsert.length} lugares`);

        // Insertar lugares sin las fotos
        const { data: insertedPlaces, error: placesError } = await this.supabase
          .from('places')
          .insert(placesToInsert.map(p => {
            const { photos, ...placeData } = p;
            return placeData;
          }))
          .select('id, order_index');

        if (placesError) {
          console.error('Error al insertar lugares:', placesError);

          // Si falla la inserción de lugares, eliminar la ruta creada
          const { error: deleteError } = await this.supabase
            .from('routes')
            .delete()
            .eq('id', newRoute.id);

          if (deleteError) {
            console.error('Error adicional al intentar eliminar la ruta:', deleteError);
          }

          throw new Error(`Error al crear los lugares: ${placesError.message || placesError.details || 'Error en la base de datos'}`);
        }

        console.log('Lugares insertados correctamente');

        // Ahora añadimos las fotos de cada lugar
        if (insertedPlaces && insertedPlaces.length > 0) {
          for (let i = 0; i < insertedPlaces.length; i++) {
            const place = insertedPlaces[i];
            const placePhotos = placesToInsert[i].photos || [];

            if (placePhotos.length > 0) {
              const photosToInsert = placePhotos.map((photo, idx) => ({
                place_id: place.id,
                public_url: photo.url,    // URL de Cloudinary
                caption: photo.caption || '',
                order_index: idx + 1
              }));

              const { error: placePhotosError } = await this.supabase
                .from('place_photos')
                .insert(photosToInsert);

              if (placePhotosError) {
                console.error(`Error al añadir fotos al lugar ${place.id}:`, placePhotosError);
                // Continuar aunque haya error en las fotos
              }
            }
          }
        }
      }

      return {
        success: true,
        message: 'Ruta creada exitosamente',
        route: {
          id: newRoute.id
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
      const {
        is_public,
        cover_image,
        description,        // Nueva descripción
        title,              // Permitir actualizar el título
        photos = []         // Fotos actualizadas (URLs de Cloudinary)
      } = routeData;

      // Actualizar la ruta
      const { error: updateError } = await this.supabase
        .from('routes')
        .update({
          is_public,
          cover_image,
          description,       // Actualizar descripción
          title,             // Actualizar título si se proporcionó
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId);

      if (updateError) {
        throw updateError;
      }

      // Actualizar fotos si se proporcionaron
      if (photos && photos.length > 0) {
        // Primero eliminamos las fotos existentes
        const { error: deleteError } = await this.supabase
          .from('route_photos')
          .delete()
          .eq('route_id', routeId);

        if (deleteError) {
          console.error('Error al eliminar fotos antiguas:', deleteError);
          // Continuamos aunque haya error
        }

        // Luego insertamos las nuevas
        const routePhotos = photos.map((photo, index) => {
          return {
            route_id: routeId,
            public_url: photo.url,
            caption: photo.caption || '',
            order_index: index + 1
          };
        });

        const { error: insertError } = await this.supabase
          .from('route_photos')
          .insert(routePhotos);

        if (insertError) {
          console.error('Error al actualizar fotos:', insertError);
          // Continuamos aunque haya error
        }
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
          user_id,
          country
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

  /**
   * Obtiene todas las rutas ordenadas cronológicamente de reciente a antiguo
   * @param {Object} options - Opciones de paginación
   * @param {number} options.limit - Límite de rutas a retornar
   * @param {number} options.offset - Desplazamiento para paginación
   * @param {string|null} userId - ID del usuario autenticado (opcional)
   * @returns {Promise<Array>} - Lista de rutas ordenadas cronológicamente
   */
  async getAllRoutes(options = {}, userId = null) {
    const { limit = 20, offset = 0 } = options;

    try {
      // Consulta base para obtener todas las rutas
      let query = this.supabase
        .from('routes')
        .select(`
          id,
          title,
          description,
          is_public,
          likes_count,
          saved_count,
          comments_count,
          days_count,
          places_count,
          cover_image,
          created_at,
          updated_at,
          user_id,
          country
        `)
        .eq('is_public', true) // Solo rutas públicas
        .order('created_at', { ascending: false }); // Orden cronológico: de más reciente a más antiguo

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

      // Consulta para obtener todos los detalles necesarios de los usuarios
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id, username, avatar_url, nomada_id')
        .in('id', userIds);

      if (usersError) {
        console.error('Error al obtener usuarios:', usersError);
        // Continuar con información parcial de usuario
      }

      // Crear un mapa de usuarios para acceso rápido
      const userMap = {};
      if (users) {
        users.forEach(user => {
          userMap[user.id] = user;
        });
      }

      // Obtener todas las fotos de las rutas en una consulta
      const routeIds = routes.map(route => route.id);
      const { data: allPhotos, error: photosError } = await this.supabase
        .from('route_photos')
        .select('id, route_id, public_url, caption, order_index')
        .in('route_id', routeIds)
        .order('order_index', { ascending: true });

      if (photosError) {
        console.error('Error al obtener fotos de rutas:', photosError);
        // Continuar sin fotos
      }

      // Crear un mapa de fotos por ruta
      const photosMap = {};
      if (allPhotos && allPhotos.length > 0) {
        allPhotos.forEach(photo => {
          if (!photosMap[photo.route_id]) {
            photosMap[photo.route_id] = [];
          }
          photosMap[photo.route_id].push(photo);
        });
      }

      // Para cada ruta, buscar información detallada del usuario si no está completa
      const routesWithDetails = await Promise.all(routes.map(async route => {
        let userData = userMap[route.user_id];

        // Si no hay información completa del usuario o falta nomada_id, buscar directamente
        if (!userData || !userData.nomada_id || !userData.full_name) {
          const { data: userDetails, error: userDetailsError } = await this.supabase
            .from('users')
            .select('id, username, full_name, avatar_url, nomada_id')
            .eq('id', route.user_id)
            .single();

          if (!userDetailsError && userDetails) {
            userData = userDetails;
            // Actualizar el mapa para futuros usos
            userMap[route.user_id] = userDetails;
          }
        }

        // Añadir las fotos de la ruta
        const routePhotos = photosMap[route.id] || [];

        return {
          ...route,
          photos: routePhotos,
          user: userData || {
            id: route.user_id,
            nomada_id: null,
            full_name: null,
            username: null,
            avatar_url: null
          }
        };
      }));

      return routesWithDetails;
    } catch (error) {
      console.error('Error al obtener todas las rutas:', error);
      throw new Error(`Error al obtener las rutas: ${error.message}`);
    }
  }

  /**
   * Añade o actualiza fotos para un lugar específico
   * @param {string} placeId - ID del lugar
   * @param {Array} photos - Fotos a añadir (URLs de Cloudinary)
   * @param {string} userId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async updatePlacePhotos(placeId, photos, userId) {
    try {
      // Verificar que el lugar existe
      const { data: place, error: placeError } = await this.supabase
        .from('places')
        .select('id, route_id')
        .eq('id', placeId)
        .single();

      if (placeError || !place) {
        throw new Error('Lugar no encontrado');
      }

      // Verificar que el usuario tiene permisos para modificar este lugar
      const { data: route, error: routeError } = await this.supabase
        .from('routes')
        .select('id, user_id')
        .eq('id', place.route_id)
        .single();

      if (routeError || !route) {
        throw new Error('No se pudo verificar la ruta asociada al lugar');
      }

      if (route.user_id !== userId) {
        throw new Error('No tienes permiso para modificar este lugar');
      }

      // Eliminar fotos existentes
      const { error: deleteError } = await this.supabase
        .from('place_photos')
        .delete()
        .eq('place_id', placeId);

      if (deleteError) {
        console.error('Error al eliminar fotos existentes:', deleteError);
        // Continuamos aunque haya error
      }

      // Si no hay fotos nuevas, terminamos aquí
      if (!photos || photos.length === 0) {
        return {
          success: true,
          message: 'Fotos eliminadas correctamente'
        };
      }

      // Añadir nuevas fotos
      const photosToInsert = photos.map((photo, index) => ({
        place_id: placeId,
        public_url: photo.url,
        caption: photo.caption || '',
        order_index: index + 1
      }));

      const { error: insertError } = await this.supabase
        .from('place_photos')
        .insert(photosToInsert);

      if (insertError) {
        throw new Error(`Error al añadir fotos: ${insertError.message}`);
      }

      return {
        success: true,
        message: 'Fotos actualizadas correctamente'
      };
    } catch (error) {
      console.error('Error al actualizar fotos del lugar:', error);
      throw error;
    }
  }

  /**
   * Obtiene las fotos de un lugar específico
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Array>} - Lista de fotos del lugar
   */
  async getPlacePhotos(placeId) {
    try {
      const { data, error } = await this.supabase
        .from('place_photos')
        .select('id, public_url, caption, order_index')
        .eq('place_id', placeId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error al obtener fotos del lugar:', error);
        throw new Error('Error al obtener las fotos');
      }

      return data || [];
    } catch (error) {
      console.error('Error completo al obtener fotos del lugar:', error);
      throw error;
    }
  }
}

module.exports = RouteService; 