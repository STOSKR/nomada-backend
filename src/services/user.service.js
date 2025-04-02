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
      .select('id, username, email, full_name, bio, preferences, visited_countries, followers_count, following_count')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error('Error al obtener perfil del usuario');
    }

    if (!data) {
      throw new Error('Usuario no encontrado');
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
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      bio: data.bio,
      preferences: data.preferences,
      visitedCountries: data.visited_countries,
      followersCount: data.followers_count,
      followingCount: data.following_count,
      isFollowing
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
}

module.exports = UserService; 