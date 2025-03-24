/**
 * Servicio de rutas de viaje
 * 
 * Maneja la lógica de negocio para la gestión de rutas, destinos y optimización
 */
class RouteService {
  /**
   * Constructor del servicio
   * @param {Object} supabase - Cliente de Supabase
   */
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Listar rutas de viaje de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Object>} - Lista de rutas y conteo total
   */
  async listRoutes(userId, options = {}) {
    const { limit = 10, offset = 0, status } = options;
    
    // Construir query
    let query = this.supabase
      .from('routes')
      .select('id, name, description, start_date, end_date, status, destinations, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtro por estado si se especifica
    if (status) {
      query = query.eq('status', status);
    }
    
    // Ejecutar consulta
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Error al listar rutas: ${error.message}`);
    }
    
    // Transformar datos para la respuesta
    const routes = data.map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      startDate: route.start_date,
      endDate: route.end_date,
      status: route.status,
      destinations: route.destinations.map(d => d.placeName || d.placeId),
      createdAt: route.created_at
    }));
    
    return {
      routes,
      count
    };
  }

  /**
   * Obtener detalles de una ruta específica
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Promise<Object>} - Detalles completos de la ruta
   */
  async getRouteById(routeId, userId) {
    // Obtener ruta con información básica
    const { data: route, error } = await this.supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();
    
    if (error) {
      throw new Error(`Error al obtener ruta: ${error.message}`);
    }
    
    if (!route) {
      throw new Error('Ruta no encontrada');
    }
    
    // Verificar permiso
    if (route.user_id !== userId) {
      throw new Error('No tienes permiso para ver esta ruta');
    }
    
    // Obtener información detallada de destinos
    const destinations = await this._getDetailedDestinations(route.destinations);
    
    // Calcular distancia total
    const totalDistance = this._calculateTotalDistance(destinations);
    
    // Formatear para la respuesta
    return {
      id: route.id,
      name: route.name,
      description: route.description,
      startDate: route.start_date,
      endDate: route.end_date,
      status: route.status,
      destinations,
      createdAt: route.created_at,
      updatedAt: route.updated_at,
      totalDistance,
      budget: route.budget || {
        transportation: 0,
        accommodation: 0,
        activities: 0,
        food: 0,
        other: 0,
        total: 0
      }
    };
  }

  /**
   * Crear una nueva ruta de viaje
   * @param {string} userId - ID del usuario
   * @param {Object} routeData - Datos de la ruta a crear
   * @returns {Promise<Object>} - Ruta creada
   */
  async createRoute(userId, routeData) {
    const { name, description, startDate, endDate, status, destinations } = routeData;
    
    // Verificar que destinations sea un array válido
    if (!Array.isArray(destinations) || destinations.length === 0) {
      throw new Error('La ruta debe tener al menos un destino');
    }
    
    // Verificar que los place IDs existan en la BD
    await this._validatePlaceIds(destinations.map(d => d.placeId));
    
    // Enriquecer datos de destinos con nombres
    const enrichedDestinations = await this._enrichDestinationsWithNames(destinations);
    
    // Crear la ruta
    const { data, error } = await this.supabase
      .from('routes')
      .insert({
        user_id: userId,
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        status: status || 'planned',
        destinations: enrichedDestinations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, name')
      .single();
    
    if (error) {
      throw new Error(`Error al crear ruta: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Actualizar una ruta existente
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @param {Object} routeData - Datos actualizados
   * @returns {Promise<void>}
   */
  async updateRoute(routeId, userId, routeData) {
    // Verificar que la ruta exista y pertenezca al usuario
    const { data: existingRoute, error: fetchError } = await this.supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single();
    
    if (fetchError) {
      throw new Error('Route not found');
    }
    
    if (existingRoute.user_id !== userId) {
      throw new Error('Unauthorized access');
    }
    
    // Preparar datos para actualizar
    const updateData = {};
    
    if (routeData.name) updateData.name = routeData.name;
    if (routeData.description) updateData.description = routeData.description;
    if (routeData.startDate) updateData.start_date = routeData.startDate;
    if (routeData.endDate) updateData.end_date = routeData.endDate;
    if (routeData.status) updateData.status = routeData.status;
    
    // Si se actualizan los destinos, validar y enriquecer
    if (routeData.destinations) {
      await this._validatePlaceIds(routeData.destinations.map(d => d.placeId));
      updateData.destinations = await this._enrichDestinationsWithNames(routeData.destinations);
    }
    
    updateData.updated_at = new Date().toISOString();
    
    // Actualizar la ruta
    const { error: updateError } = await this.supabase
      .from('routes')
      .update(updateData)
      .eq('id', routeId);
    
    if (updateError) {
      throw new Error(`Error al actualizar ruta: ${updateError.message}`);
    }
  }

  /**
   * Eliminar una ruta
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Promise<void>}
   */
  async deleteRoute(routeId, userId) {
    // Verificar que la ruta exista y pertenezca al usuario
    const { data: existingRoute, error: fetchError } = await this.supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single();
    
    if (fetchError) {
      throw new Error('Route not found');
    }
    
    if (existingRoute.user_id !== userId) {
      throw new Error('Unauthorized access');
    }
    
    // Eliminar la ruta
    const { error: deleteError } = await this.supabase
      .from('routes')
      .delete()
      .eq('id', routeId);
    
    if (deleteError) {
      throw new Error(`Error al eliminar ruta: ${deleteError.message}`);
    }
  }

  /**
   * Optimizar el orden de los destinos en una ruta
   * @param {string} routeId - ID de la ruta
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Promise<Object>} - Información de la ruta optimizada
   */
  async optimizeRoute(routeId, userId) {
    // Obtener la ruta completa
    const route = await this.getRouteById(routeId, userId);
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    // Calcular la distancia original
    const originalDistance = this._calculateTotalDistance(route.destinations);
    
    // Si hay menos de 3 destinos, no hay nada que optimizar
    if (route.destinations.length < 3) {
      return {
        originalDistance,
        optimizedDistance: originalDistance,
        destinations: route.destinations.map(d => ({
          order: d.order,
          placeId: d.placeId,
          placeName: d.placeName
        }))
      };
    }
    
    // Aplicar algoritmo de optimización (TSP - Nearest Neighbor como ejemplo)
    const optimizedDestinations = this._optimizeDestinationsOrder(route.destinations);
    
    // Calcular nueva distancia total
    const optimizedDistance = this._calculateTotalDistance(optimizedDestinations);
    
    // Actualizar la ruta en la base de datos
    await this.supabase
      .from('routes')
      .update({ 
        destinations: optimizedDestinations,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);
    
    // Devolver información resumida de la optimización
    return {
      originalDistance,
      optimizedDistance,
      destinations: optimizedDestinations.map(d => ({
        order: d.order,
        placeId: d.placeId,
        placeName: d.placeName
      }))
    };
  }

  /**
   * Obtener información detallada de los destinos
   * @param {Array} destinations - Lista básica de destinos
   * @returns {Promise<Array>} - Lista enriquecida de destinos
   * @private
   */
  async _getDetailedDestinations(destinations) {
    // Aquí obtendríamos más detalles de cada destino desde la BD
    // Como actividades, alojamiento, etc.
    // Por simplicidad, solo añadimos campos ficticios
    
    return destinations.map(destination => ({
      ...destination,
      activities: destination.activities || []
    }));
  }

  /**
   * Validar que los IDs de lugares existan en la base de datos
   * @param {Array<string>} placeIds - Lista de IDs de lugares
   * @returns {Promise<void>}
   * @private
   */
  async _validatePlaceIds(placeIds) {
    // Query para verificar existencia de places
    const { data, error } = await this.supabase
      .from('places')
      .select('id')
      .in('id', placeIds);
    
    if (error) {
      throw new Error(`Error al validar destinos: ${error.message}`);
    }
    
    // Verificar que todos los places existan
    const foundIds = data.map(place => place.id);
    const missingIds = placeIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      throw new Error(`Los siguientes destinos no existen: ${missingIds.join(', ')}`);
    }
  }

  /**
   * Enriquecer destinos con nombres de lugares
   * @param {Array} destinations - Lista de destinos con placeId
   * @returns {Promise<Array>} - Destinos enriquecidos con nombre
   * @private
   */
  async _enrichDestinationsWithNames(destinations) {
    // Extraer IDs de lugares
    const placeIds = destinations.map(d => d.placeId);
    
    // Obtener información de lugares
    const { data: places, error } = await this.supabase
      .from('places')
      .select('id, name')
      .in('id', placeIds);
    
    if (error) {
      throw new Error(`Error al obtener información de destinos: ${error.message}`);
    }
    
    // Crear mapa de ID a nombre
    const placeMap = {};
    places.forEach(place => {
      placeMap[place.id] = place.name;
    });
    
    // Enriquecer destinos con nombres
    return destinations.map(destination => ({
      ...destination,
      placeName: placeMap[destination.placeId] || 'Destino desconocido'
    }));
  }

  /**
   * Calcular distancia total de una ruta
   * @param {Array} destinations - Lista de destinos
   * @returns {number} - Distancia total en km
   * @private
   */
  _calculateTotalDistance(destinations) {
    // En una implementación real, usaríamos las coordenadas 
    // y un servicio de cálculo de distancias
    // Por simplicidad, devolvemos un valor ficticio
    return destinations.length > 1 ? 
      (destinations.length - 1) * 500 + Math.random() * 200 : 0;
  }

  /**
   * Optimizar orden de destinos (implementación simplificada)
   * @param {Array} destinations - Lista original de destinos
   * @returns {Array} - Lista optimizada de destinos
   * @private
   */
  _optimizeDestinationsOrder(destinations) {
    // En una implementación real implementaríamos un algoritmo TSP
    // como Nearest Neighbor, 2-opt, o usar un servicio externo
    
    // Por simplicidad, aquí solo reordenamos y actualizamos el campo "order"
    const optimized = [...destinations].sort((a, b) => a.placeId.localeCompare(b.placeId));
    
    return optimized.map((dest, index) => ({
      ...dest,
      order: index + 1
    }));
  }
}

module.exports = RouteService; 