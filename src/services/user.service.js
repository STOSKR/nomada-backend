/**
 * Servicio de usuarios
 * 
 * Maneja la lógica de negocio para la gestión de usuarios, autenticación y perfiles
 */
class UserService {
  /**
   * Constructor del servicio
   * @param {Object} supabase - Cliente de Supabase
   */
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Promise<Object>} - Usuario registrado
   */
  async registerUser(userData) {
    const { email, password, username, fullName, bio } = userData;

    // Verificar si el email ya está registrado
    const { data: existingEmail } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      throw new Error('El email ya está registrado');
    }

    // Verificar si el username ya está en uso
    const { data: existingUsername } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUsername) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(`Error al registrar usuario: ${authError.message}`);
    }

    // Crear perfil en la tabla users
    const { data: userProfile, error: profileError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        full_name: fullName || null,
        bio: bio || null,
        preferences: {},
        visited_countries: []
      })
      .select('id, username, email')
      .single();

    if (profileError) {
      // Si hay error al crear perfil, intentar eliminar el usuario de auth
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    return {
      success: true,
      message: 'Usuario registrado correctamente',
      user: userProfile
    };
  }

  /**
   * Iniciar sesión de usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} - Datos del usuario autenticado
   */
  async loginUser(email, password) {
    // Autenticar con Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error('Credenciales incorrectas');
    }

    // Obtener datos del perfil
    const { data: userData, error: profileError } = await this.supabase
      .from('users')
      .select('id, username, email')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error('Error al obtener datos del usuario');
    }

    return {
      user: userData
    };
  }

  /**
   * Obtener perfil completo del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Perfil del usuario
   */
  async getUserProfile(userId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, full_name, bio, preferences, visited_countries')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error('Error al obtener perfil del usuario');
    }

    if (!data) {
      throw new Error('Usuario no encontrado');
    }

    // Formatear para la respuesta
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      bio: data.bio,
      preferences: data.preferences || {},
      visitedCountries: data.visited_countries || []
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

    // Actualizar en la base de datos
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