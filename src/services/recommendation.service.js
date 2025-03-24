/**
 * Servicio de recomendaciones
 * 
 * Maneja la lógica de negocio para generar recomendaciones personalizadas para los usuarios
 */
class RecommendationService {
  /**
   * Constructor del servicio
   * @param {Object} supabase - Cliente de Supabase
   */
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Obtener recomendaciones personalizadas de destinos
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado (región, estilo, presupuesto, etc.)
   * @returns {Promise<Array>} - Lista de destinos recomendados
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    const { limit = 5, region, travelStyle, budget, duration } = options;
    
    // Obtener preferencias del usuario
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('preferences, visited_countries')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error('Error al obtener preferencias del usuario');
    }
    
    // Construir query para lugares
    let query = this.supabase
      .from('places')
      .select('*');
    
    // Filtrar por región si se especifica
    if (region) {
      query = query.eq('region', region);
    }
    
    // Filtrar por presupuesto si se especifica
    if (budget) {
      query = query.eq('budget_category', budget);
    }
    
    // Excluir países ya visitados
    const visitedCountries = userData.visited_countries || [];
    if (visitedCountries.length > 0) {
      query = query.not('country_code', 'in', `(${visitedCountries.join(',')})`);
    }
    
    // Ejecutar consulta
    const { data: places, error: placesError } = await query.limit(limit * 3); // Obtenemos más para poder ordenar
    
    if (placesError) {
      throw new Error('Error al obtener destinos recomendados');
    }
    
    // Calcular puntuación de coincidencia para cada lugar
    const scoredPlaces = places.map(place => {
      let matchScore = 0;
      const userPrefs = userData.preferences || {};
      
      // Coincidencia con estilo de viaje preferido
      if (travelStyle && place.suitable_for && place.suitable_for.includes(travelStyle)) {
        matchScore += 30;
      } else if (userPrefs.travelStyle && place.suitable_for && place.suitable_for.includes(userPrefs.travelStyle)) {
        matchScore += 20;
      }
      
      // Coincidencia con presupuesto
      if (budget && place.budget_category === budget) {
        matchScore += 25;
      } else if (userPrefs.budget && place.budget_category === userPrefs.budget) {
        matchScore += 15;
      }
      
      // Coincidencia con destinos favoritos
      if (userPrefs.favoriteDestinations && userPrefs.favoriteDestinations.some(fav => 
        place.tags && place.tags.includes(fav)
      )) {
        matchScore += 20;
      }
      
      // Bonificación por temporada óptima
      const currentMonth = new Date().getMonth() + 1;
      if (place.best_months && place.best_months.includes(currentMonth)) {
        matchScore += 10;
      }
      
      // Validación final
      return {
        ...place,
        matchScore: Math.min(100, matchScore) // Máximo 100
      };
    });
    
    // Ordenar por puntuación y tomar los mejores
    const recommendations = scoredPlaces
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(place => ({
        placeId: place.id,
        name: place.name,
        country: place.country,
        description: place.description,
        matchScore: place.matchScore,
        imageUrl: place.image_url,
        highlights: place.highlights || [],
        travelTips: place.travel_tips || [],
        bestTimeToVisit: place.best_time_to_visit || 'Todo el año',
        budget: place.budget_category,
        idealFor: place.suitable_for || []
      }));
    
    return recommendations;
  }

  /**
   * Obtener un plan personalizado para un destino específico
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @param {Object} options - Opciones (días, estilo, presupuesto)
   * @returns {Promise<Object>} - Plan detallado
   */
  async getPersonalizedPlan(userId, placeId, options = {}) {
    const { days = 3, travelStyle, budget } = options;
    
    // Obtener información del lugar
    const { data: place, error: placeError } = await this.supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();
    
    if (placeError || !place) {
      throw new Error('Place not found');
    }
    
    // Obtener preferencias del usuario
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error('Error al obtener preferencias del usuario');
    }
    
    // Determinar estilo de viaje a utilizar
    const effectiveTravelStyle = travelStyle || userData.preferences?.travelStyle || 'balanced';
    const effectiveBudget = budget || userData.preferences?.budget || 'mid-range';
    
    // Obtener actividades para el lugar
    const { data: activities, error: activitiesError } = await this.supabase
      .from('activities')
      .select('*')
      .eq('place_id', placeId);
    
    if (activitiesError) {
      throw new Error('Error al obtener actividades');
    }
    
    // Filtrar y ordenar actividades según estilo y presupuesto
    const filteredActivities = activities.filter(activity => {
      const matchesStyle = !activity.suitable_for || activity.suitable_for.includes(effectiveTravelStyle);
      const matchesBudget = !activity.budget_category || activity.budget_category === effectiveBudget;
      return matchesStyle && matchesBudget;
    });
    
    // Crear itinerario por días
    const itinerary = this._generateItinerary(filteredActivities, days, effectiveTravelStyle);
    
    // Obtener opciones de alojamiento
    const accommodationOptions = await this._getAccommodationOptions(placeId, effectiveBudget);
    
    // Obtener opciones de transporte
    const transportationOptions = await this._getTransportationOptions(placeId, effectiveBudget);
    
    // Construir respuesta
    return {
      place: {
        id: place.id,
        name: place.name,
        country: place.country,
        description: place.description
      },
      itinerary,
      accommodationOptions,
      transportationOptions
    };
  }

  /**
   * Obtener destinos similares a uno específico
   * @param {string} placeId - ID del lugar de referencia
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Lista de destinos similares
   */
  async getSimilarDestinations(placeId, limit = 5) {
    // Obtener información del lugar de referencia
    const { data: referencePlace, error: placeError } = await this.supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();
    
    if (placeError || !referencePlace) {
      throw new Error('Place not found');
    }
    
    // Consultar lugares con características similares
    const { data: places, error: placesError } = await this.supabase
      .from('places')
      .select('*')
      .neq('id', placeId) // Excluir el lugar de referencia
      .limit(limit * 2); // Obtener más para filtrar
    
    if (placesError) {
      throw new Error('Error al buscar destinos similares');
    }
    
    // Calcular similitud entre lugares
    const similarPlaces = places.map(place => {
      let similarityScore = 0;
      const similarTraits = [];
      
      // Similitud por región
      if (place.region === referencePlace.region) {
        similarityScore += 15;
        similarTraits.push(`Misma región: ${place.region}`);
      }
      
      // Similitud por presupuesto
      if (place.budget_category === referencePlace.budget_category) {
        similarityScore += 20;
        similarTraits.push(`Nivel de presupuesto similar: ${place.budget_category}`);
      }
      
      // Similitud por actividades/tipo
      if (place.suitable_for && referencePlace.suitable_for) {
        const commonStyles = place.suitable_for.filter(style => 
          referencePlace.suitable_for.includes(style)
        );
        
        if (commonStyles.length > 0) {
          similarityScore += 25 * (commonStyles.length / referencePlace.suitable_for.length);
          similarTraits.push(`Ideal para: ${commonStyles.join(', ')}`);
        }
      }
      
      // Similitud por etiquetas
      if (place.tags && referencePlace.tags) {
        const commonTags = place.tags.filter(tag => 
          referencePlace.tags.includes(tag)
        );
        
        if (commonTags.length > 0) {
          similarityScore += 20 * (commonTags.length / referencePlace.tags.length);
          similarTraits.push(`Características similares: ${commonTags.join(', ')}`);
        }
      }
      
      return {
        ...place,
        similarityScore,
        similarTraits
      };
    });
    
    // Ordenar por puntuación de similitud y tomar los mejores
    return similarPlaces
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(place => ({
        placeId: place.id,
        name: place.name,
        country: place.country,
        description: place.description,
        similarityScore: parseFloat((place.similarityScore / 100).toFixed(2)),
        imageUrl: place.image_url,
        similarTraits: place.similarTraits
      }));
  }

  /**
   * Generar una ruta óptima entre destinos
   * @param {Array<string>} destinations - IDs de los destinos
   * @param {Object} options - Opciones (punto inicio/fin, criterio)
   * @returns {Promise<Object>} - Ruta optimizada
   */
  async generateOptimalRoute(destinations, options = {}) {
    const { startLocation, endLocation, optimizationCriteria = 'balanced' } = options;
    
    // Validar que todos los destinos existan
    const { data: places, error: placesError } = await this.supabase
      .from('places')
      .select('id, name, country, coordinates')
      .in('id', destinations);
    
    if (placesError) {
      throw new Error('Error al obtener información de destinos');
    }
    
    if (places.length !== destinations.length) {
      const foundIds = places.map(p => p.id);
      const missingIds = destinations.filter(id => !foundIds.includes(id));
      throw new Error(`Los siguientes destinos no existen: ${missingIds.join(', ')}`);
    }
    
    // Crear mapa de ID a datos del lugar
    const placeMap = {};
    places.forEach(place => {
      placeMap[place.id] = place;
    });
    
    // En una implementación real, aquí usaríamos un algoritmo de optimización de rutas
    // como TSP (Traveling Salesman Problem) o consultar un servicio externo.
    // En este ejemplo, simplemente ordenamos los lugares por criterio
    
    let orderedDestinations;
    
    if (optimizationCriteria === 'distance') {
      // Ordenar por "cercanía" (simplificado)
      orderedDestinations = this._orderByDistance(destinations, placeMap, startLocation, endLocation);
    } else {
      // Ordenar por otro criterio o dejar como está
      orderedDestinations = destinations;
    }
    
    // Construir la ruta
    const route = orderedDestinations.map((placeId, index) => {
      const place = placeMap[placeId];
      return {
        order: index + 1,
        placeId: place.id,
        placeName: place.name,
        country: place.country,
        suggestedDays: Math.floor(Math.random() * 3) + 2 // 2-4 días (ejemplo)
      };
    });
    
    // Calcular valores ficticios para distancia, tiempo y costo
    const totalDistance = (route.length - 1) * 500 + Math.random() * 1000;
    const estimatedTravelTime = totalDistance / 80; // Aproximadamente 80km/h promedio
    const estimatedCost = totalDistance * 0.15 * (optimizationCriteria === 'cost' ? 0.8 : 1);
    
    // Generar opciones de transporte ficticias
    const transportationOptions = [];
    for (let i = 0; i < route.length - 1; i++) {
      transportationOptions.push({
        fromPlace: route[i].placeName,
        toPlace: route[i + 1].placeName,
        options: this._generateTransportOptions(route[i].placeId, route[i + 1].placeId, optimizationCriteria)
      });
    }
    
    return {
      route,
      totalDistance: Math.round(totalDistance),
      estimatedTravelTime: Math.round(estimatedTravelTime * 10) / 10,
      estimatedCost: Math.round(estimatedCost),
      transportationOptions
    };
  }

  /**
   * Generar un itinerario de actividades por días
   * @param {Array} activities - Lista de actividades disponibles
   * @param {number} days - Número de días
   * @param {string} travelStyle - Estilo de viaje preferido
   * @returns {Array} - Itinerario organizado por días
   * @private
   */
  _generateItinerary(activities, days, travelStyle) {
    // Determinar número de actividades por día según estilo
    let activitiesPerDay;
    switch (travelStyle) {
      case 'adventure':
        activitiesPerDay = 4;
        break;
      case 'relax':
        activitiesPerDay = 2;
        break;
      default:
        activitiesPerDay = 3;
    }
    
    // Clonar y barajar actividades
    const shuffled = [...activities].sort(() => 0.5 - Math.random());
    
    // Generar itinerario por días
    const itinerary = [];
    for (let day = 1; day <= days; day++) {
      // Seleccionar actividades para este día
      const dayActivities = shuffled
        .splice(0, activitiesPerDay)
        .map(activity => ({
          name: activity.name,
          description: activity.description,
          type: activity.type || 'general',
          duration: activity.duration || '2 horas',
          location: activity.location || 'Ubicación no especificada',
          cost: activity.cost || 'Varía'
        }));
      
      // Si nos quedamos sin actividades, reciclar
      if (shuffled.length < activitiesPerDay && activities.length > 0) {
        shuffled.push(...activities.sort(() => 0.5 - Math.random()));
      }
      
      itinerary.push({
        day,
        activities: dayActivities
      });
    }
    
    return itinerary;
  }

  /**
   * Obtener opciones de alojamiento para un lugar
   * @param {string} placeId - ID del lugar
   * @param {string} budget - Categoría de presupuesto
   * @returns {Promise<Array>} - Opciones de alojamiento
   * @private
   */
  async _getAccommodationOptions(placeId, budget) {
    // En una implementación real, consultaríamos la tabla de alojamientos
    // Por simplicidad, devolvemos datos ficticios
    
    const budgetOptions = {
      'budget': [
        {
          name: 'Hostal Backpackers',
          type: 'hostel',
          priceRange: '$15-30 por noche',
          location: 'Centro',
          amenities: ['WiFi gratis', 'Cocina compartida', 'Lockers']
        },
        {
          name: 'Guesthouse Local',
          type: 'guesthouse',
          priceRange: '$25-40 por noche',
          location: 'Zona turística',
          amenities: ['Desayuno incluido', 'WiFi gratis', 'Baño privado']
        }
      ],
      'mid-range': [
        {
          name: 'Hotel Confort',
          type: 'hotel',
          priceRange: '$60-100 por noche',
          location: 'Centro histórico',
          amenities: ['Desayuno incluido', 'WiFi gratis', 'Aire acondicionado', 'TV']
        },
        {
          name: 'Apartamento Céntrico',
          type: 'apartment',
          priceRange: '$70-120 por noche',
          location: 'Zona comercial',
          amenities: ['Cocina completa', 'WiFi gratis', 'Lavadora']
        }
      ],
      'luxury': [
        {
          name: 'Gran Hotel Lujo',
          type: 'luxury hotel',
          priceRange: '$200-350 por noche',
          location: 'Zona exclusiva',
          amenities: ['Desayuno buffet', 'Spa', 'Piscina', 'Restaurante', 'Bar']
        },
        {
          name: 'Villa Exclusiva',
          type: 'villa',
          priceRange: '$300-500 por noche',
          location: 'Vista panorámica',
          amenities: ['Piscina privada', 'Jardín', 'Terraza', 'Servicio de limpieza']
        }
      ]
    };
    
    return budgetOptions[budget] || budgetOptions['mid-range'];
  }

  /**
   * Obtener opciones de transporte para un lugar
   * @param {string} placeId - ID del lugar
   * @param {string} budget - Categoría de presupuesto
   * @returns {Promise<Array>} - Opciones de transporte
   * @private
   */
  async _getTransportationOptions(placeId, budget) {
    // Opciones ficticias de transporte según presupuesto
    const options = [
      {
        type: 'Transporte público',
        description: 'Autobuses y metro locales',
        cost: 'Económico'
      },
      {
        type: 'Alquiler de bicicleta',
        description: 'Ideal para recorrer el centro',
        cost: 'Económico'
      }
    ];
    
    if (budget !== 'budget') {
      options.push({
        type: 'Taxi/Rideshare',
        description: 'Uber, Cabify o taxis locales',
        cost: 'Moderado'
      });
    }
    
    if (budget === 'luxury') {
      options.push({
        type: 'Coche con chofer',
        description: 'Servicio privado con guía local',
        cost: 'Premium'
      });
    }
    
    return options;
  }

  /**
   * Generar opciones de transporte entre dos lugares
   * @param {string} fromPlaceId - ID del lugar de origen
   * @param {string} toPlaceId - ID del lugar de destino
   * @param {string} optimizationCriteria - Criterio de optimización
   * @returns {Array} - Opciones de transporte
   * @private
   */
  _generateTransportOptions(fromPlaceId, toPlaceId, optimizationCriteria) {
    // Opciones ficticias según el criterio de optimización
    const options = [
      {
        type: 'Autobús',
        duration: '5-7 horas',
        cost: '$20-40',
        frequency: 'Diario'
      },
      {
        type: 'Tren',
        duration: '3-4 horas',
        cost: '$40-70',
        frequency: 'Lunes, Miércoles, Viernes'
      }
    ];
    
    // Añadir opciones según criterio
    if (optimizationCriteria !== 'cost') {
      options.push({
        type: 'Avión',
        duration: '1 hora',
        cost: '$100-180',
        frequency: 'Jueves, Sábado, Domingo'
      });
    }
    
    if (optimizationCriteria === 'time') {
      options.sort((a, b) => {
        const aHours = parseInt(a.duration.split('-')[0]);
        const bHours = parseInt(b.duration.split('-')[0]);
        return aHours - bHours;
      });
    } else if (optimizationCriteria === 'cost') {
      options.sort((a, b) => {
        const aCost = parseInt(a.cost.substring(1).split('-')[0]);
        const bCost = parseInt(b.cost.substring(1).split('-')[0]);
        return aCost - bCost;
      });
    }
    
    return options;
  }

  /**
   * Ordenar destinos por cercanía (implementación simplificada)
   * @param {Array<string>} destinations - IDs de destinos
   * @param {Object} placeMap - Mapa de ID a datos de lugar
   * @param {string} startLocationId - ID del punto de inicio
   * @param {string} endLocationId - ID del punto final
   * @returns {Array<string>} - Destinos ordenados
   * @private
   */
  _orderByDistance(destinations, placeMap, startLocationId, endLocationId) {
    // En una implementación real, usaríamos las coordenadas reales
    // y un algoritmo de optimización como Nearest Neighbor o similar
    
    // Por simplicidad, sólo ordenamos alfabéticamente como ejemplo
    const destinationsCopy = [...destinations];
    
    // Si hay punto de inicio específico, ponerlo primero
    if (startLocationId && destinations.includes(startLocationId)) {
      const index = destinationsCopy.indexOf(startLocationId);
      destinationsCopy.splice(index, 1);
      destinationsCopy.unshift(startLocationId);
    }
    
    // Si hay punto final específico, ponerlo último
    if (endLocationId && destinations.includes(endLocationId)) {
      const index = destinationsCopy.indexOf(endLocationId);
      if (index !== -1) {
        destinationsCopy.splice(index, 1);
      }
      destinationsCopy.push(endLocationId);
    }
    
    return destinationsCopy;
  }
}

module.exports = RecommendationService; 