/**
 * Servicio para gestión de usuarios, autenticación y perfiles
 */
class UserService {
  /**
   * Constructor del servicio
   * @param {Object} supabase - Cliente de Supabase
   */
  constructor(supabase) {
    if (!supabase) {
      console.error('Error: Cliente de Supabase no inicializado');
      throw new Error('Cliente de Supabase no disponible');
    }
    this.supabase = supabase;
    console.log('UserService inicializado con cliente Supabase');
  }

  /**
   * Obtener perfil completo del usuario
   * @param {string} userId - ID del usuario
   * @param {string} currentUserId - ID del usuario que hace la solicitud (opcional)
   * @returns {Promise<Object>} - Perfil del usuario
   */
  async getUserProfile(userId, currentUserId = null) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, nomada_id, username, email, bio, avatar_url, preferences, visited_countries, followers_count, following_count')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener perfil:', error);
      throw new Error('Error al obtener perfil del usuario');
    }

    if (!data) {
      throw new Error('Usuario no encontrado');
    }

    // Contar el número de rutas creadas por el usuario
    const { count: routesCount, error: routesError } = await this.supabase
      .from('routes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (routesError) {
      console.error('Error al contar rutas del usuario:', routesError);
    }

    // Obtener las rutas públicas del usuario
    const { data: userRoutes, error: userRoutesError } = await this.supabase
      .from('routes')
      .select(`
        id,
        title,
        description,
        country,
        is_public,
        likes_count,
        created_at
      `)
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (userRoutesError) {
      console.error('Error al obtener rutas del usuario:', userRoutesError);
    }

    // Verificar si el usuario actual sigue a este perfil
    let isFollowing = null;
    if (currentUserId && currentUserId !== userId) {
      const { data: followData, error: followError } = await this.supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .maybeSingle();

      if (!followError) {
        isFollowing = !!followData;
      }
    }

    return {
      id: data.id,
      nomada_id: data.nomada_id,
      username: data.username,
      email: data.email,
      bio: data.bio,
      avatar_url: data.avatar_url,
      preferences: data.preferences,
      visitedCountries: data.visited_countries,
      followersCount: data.followers_count,
      followingCount: data.following_count,
      routesCount: routesCount || 0,
      isFollowing,
      routes: userRoutes || []
    };
  }

  /**
   * Actualizar preferencias del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} preferences - Nuevas preferencias
   * @returns {Promise<void>}
   */
  async updatePreferences(userId, preferences) {
    // Obtener preferencias actuales para hacer merge
    const { data: userData, error: fetchError } = await this.supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new Error('Error al obtener preferencias actuales');
    }

    // Combinar preferencias existentes con nuevas
    const updatedPreferences = {
      ...(userData.preferences || {}),
      ...preferences
    };

    const { error: updateError } = await this.supabase
      .from('users')
      .update({ preferences: updatedPreferences })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Error al actualizar preferencias');
    }
  }

  /**
   * Añadir país visitado al perfil del usuario
   * @param {string} userId - ID del usuario
   * @param {string} countryCode - Código ISO del país
   * @param {string} visitDate - Fecha de visita (opcional)
   * @returns {Promise<Object>} - Lista actualizada de países visitados
   */
  async addVisitedCountry(userId, countryCode, visitDate) {
    // Obtener lista actual de países visitados
    const { data: userData, error: fetchError } = await this.supabase
      .from('users')
      .select('visited_countries')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new Error('Error al obtener datos del usuario');
    }

    // Verificar si el país ya está en la lista
    const visitedCountries = userData.visited_countries || [];
    if (visitedCountries.includes(countryCode)) {
      return { visitedCountries };
    }

    // Añadir nuevo país a la lista
    visitedCountries.push(countryCode);

    // Actualizar en la base de datos
    const { error: updateError } = await this.supabase
      .from('users')
      .update({ visited_countries: visitedCountries })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Error al actualizar países visitados');
    }

    return { visitedCountries };
  }

  /**
   * Eliminar un país de la lista de visitados
   * @param {string} userId - ID del usuario
   * @param {string} countryCode - Código ISO del país
   * @returns {Promise<Object>} - Lista actualizada de países visitados
   */
  async removeVisitedCountry(userId, countryCode) {
    // Obtener lista actual de países visitados
    const { data: userData, error: fetchError } = await this.supabase
      .from('users')
      .select('visited_countries')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new Error('Error al obtener datos del usuario');
    }

    // Filtrar el país a eliminar
    const visitedCountries = (userData.visited_countries || [])
      .filter(code => code !== countryCode);

    // Actualizar en la base de datos
    const { error: updateError } = await this.supabase
      .from('users')
      .update({ visited_countries: visitedCountries })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Error al actualizar países visitados');
    }

    return { visitedCountries };
  }

  /**
   * Buscar usuarios por nombre o username
   * @param {string} query - Término de búsqueda
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} - Lista de usuarios que coinciden
   */
  async searchUsers(query, limit = 10) {
    if (!query || query.length < 3) {
      throw new Error('El término de búsqueda debe tener al menos 3 caracteres');
    }

    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, full_name')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error('Error en la búsqueda de usuarios');
    }

    return data.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name
    }));
  }

  /**
   * Actualizar perfil del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar del usuario
   * @returns {Promise<Object>} - Perfil actualizado
   */
  async updateUserProfile(userId, userData) {
    // Verificar si existe el usuario
    const { data: existingUser, error: checkError } = await this.supabase
      .from('users')
      .select('id, nomada_id')
      .eq('id', userId)
      .single();

    if (checkError || !existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Si se intenta actualizar el nomada_id, verificar que no exista ya
    if (userData.nomada_id && userData.nomada_id !== existingUser.nomada_id) {
      const { data: existingNomadaId, error: nomadaIdError } = await this.supabase
        .from('users')
        .select('id')
        .eq('nomada_id', userData.nomada_id)
        .maybeSingle();

      if (existingNomadaId) {
        throw new Error('El identificador de nómada ya está en uso');
      }
    }

    // Preparar datos a actualizar (solo los campos permitidos)
    const updatableFields = ['username', 'nomada_id', 'bio'];
    const dataToUpdate = {};

    for (const field of updatableFields) {
      if (userData[field] !== undefined) {
        dataToUpdate[field] = userData[field];
      }
    }

    // Si no hay nada que actualizar, devolver error
    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error('No se proporcionaron datos válidos para actualizar');
    }

    // Actualizar perfil en la base de datos
    const { error: updateError } = await this.supabase
      .from('users')
      .update(dataToUpdate)
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Error al actualizar perfil: ${updateError.message}`);
    }

    // Obtener perfil actualizado
    return this.getUserProfile(userId, userId);
  }

  /**
   * Buscar usuario por username o nomada_id
   * @param {string} identifier - Username o nomada_id del usuario
   * @param {string} currentUserId - ID del usuario que hace la solicitud
   * @returns {Promise<Object>} - Perfil del usuario
   */
  async getUserByUsername(identifier, currentUserId) {
    // Buscar usuario por nomada_id o username
    const { data, error } = await this.supabase
      .from('users')
      .select('id, nomada_id, username, email, bio, avatar_url, preferences, visited_countries, followers_count, following_count')
      .or(`nomada_id.eq.${identifier},username.eq.${identifier}`)
      .single();

    if (error) {
      console.error('Error al buscar usuario por nombre:', error);
      throw new Error('Error al obtener perfil del usuario');
    }

    if (!data) {
      throw new Error('Usuario no encontrado');
    }

    // Contar el número de rutas creadas por el usuario
    const { count: routesCount, error: routesError } = await this.supabase
      .from('routes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', data.id);

    if (routesError) {
      console.error('Error al contar rutas del usuario:', routesError);
    }

    // Obtener las rutas públicas del usuario
    const { data: userRoutes, error: userRoutesError } = await this.supabase
      .from('routes')
      .select(`
        id,
        title,
        description,
        country,
        is_public,
        likes_count,
        created_at
      `)
      .eq('user_id', data.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (userRoutesError) {
      console.error('Error al obtener rutas del usuario:', userRoutesError);
    }

    // Verificar si el usuario actual sigue a este perfil
    let isFollowing = null;
    if (currentUserId && currentUserId !== data.id) {
      const { data: followData, error: followError } = await this.supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', data.id)
        .maybeSingle();

      if (!followError) {
        isFollowing = !!followData;
      }
    }

    return {
      id: data.id,
      nomada_id: data.nomada_id,
      username: data.username,
      email: data.email,
      bio: data.bio,
      avatar_url: data.avatar_url,
      preferences: data.preferences,
      visitedCountries: data.visited_countries,
      followersCount: data.followers_count,
      followingCount: data.following_count,
      routesCount: routesCount || 0,
      isFollowing,
      routes: userRoutes || []
    };
  }
}

module.exports = UserService; 