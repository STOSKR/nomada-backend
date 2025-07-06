/**
 * Servicio para la autenticación de usuarios
 */
class AuthService {
    /**
     * Constructor del servicio
     * @param {Object} supabase - Cliente de Supabase
     */
    constructor(supabase) {
        if (!supabase) {
            throw new Error('Cliente de Supabase no disponible');
        }
        this.supabase = supabase;
    }

    /**
     * Genera un nomada_id único basado en el nombre del usuario
     * @param {string} name - Nombre del usuario (username o full_name)
     * @returns {Promise<string>} - nomada_id único generado
     */
    async generateUniqueNomadaId(name) {
        let baseId = (name || 'nomada')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 10);

        if (!baseId) baseId = 'nomada';

        let counter = 1;
        let nomadaId = baseId;

        while (true) {
            const { data, error } = await this.supabase
                .from('users')
                .select('id')
                .eq('nomada_id', nomadaId)
                .single();

            if (error && error.code === 'PGRST116') {
                // No existe, podemos usar este ID
                break;
            }

            nomadaId = `${baseId}${counter}`;
            counter++;
        }

        return nomadaId;
    }

    /**
     * Registrar un nuevo usuario
     * @param {Object} userData - Datos del usuario a registrar
     * @returns {Promise<Object>} - Usuario registrado y token de sesión
     */    async signup(userData) {
        const { email, password, username, bio, avatar_url } = userData;

        // Verificar si el email ya está registrado
        const { data: existingEmail } = await this.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingEmail) {
            throw new Error('El email ya está registrado');
        }

        // Generar nomada_id único automáticamente
        const nomada_id = await this.generateUniqueNomadaId(username || email.split('@')[0]);        // Registrar usuario en Supabase Auth
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: undefined // Deshabilitar confirmación de email para desarrollo
            }
        });

        if (authError) {
            throw new Error(`Error al registrar usuario: ${authError.message}`);
        }        // Crear perfil en la tabla users
        const { data: userProfile, error: profileError } = await this.supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                nomada_id,
                username: username || null,
                bio: bio || null,
                avatar_url: avatar_url || null,
                preferences: {},
                visited_countries: []
            })
            .select('id, nomada_id, username, email, avatar_url')
            .single();

        if (profileError) {
            // Si hay error al crear perfil, eliminar el usuario de auth para mantener consistencia
            await this.supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(`Error al crear perfil: ${profileError.message}`);
        }

        return {
            success: true,
            message: 'Usuario registrado correctamente',
            user: userProfile,
            session: authData.session
        };
    }

    /**
     * Iniciar sesión de usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} - Datos del usuario autenticado y token
     */    async login(email, password) {
        console.log('Intentando login con email:', email);

        const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error('Error de autenticación en Supabase:', authError);
            throw new Error(`Credenciales incorrectas: ${authError.message}`);
        }

        // Loguear el ID del usuario que se autenticó
        console.log('Usuario autenticado con ID:', authData.user.id);

        const { data: userData, error: profileError } = await this.supabase
            .from('users')
            .select('id, nomada_id, username, email, bio')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            throw new Error(`Error al obtener datos del usuario: ${profileError.message || profileError.details || 'Detalles no disponibles'}`);
        }

        return {
            user: userData,
            session: authData.session
        };
    }

    /**
     * Cerrar sesión de usuario
     * @returns {Promise<Object>} - Confirmación de cierre de sesión
     */
    async logout() {
        try {
            // Cerrar sesión en Supabase
            const { error: supabaseError } = await this.supabase.auth.signOut();

            if (supabaseError) {
                throw new Error(`Error al cerrar sesión en Supabase: ${supabaseError.message}`);
            }

            // En el servidor no tenemos acceso a localStorage o sessionStorage
            // Estas líneas solo funcionan en el navegador, las comentamos
            // localStorage.removeItem('token');
            // sessionStorage.removeItem('token');

            return {
                success: true,
                message: 'Sesión cerrada correctamente'
            };
        } catch (error) {
            console.error('Error durante el logout:', error);
            throw new Error(`Error al cerrar sesión: ${error.message}`);
        }
    }

    /**
     * Verificar token de autenticación
     * @param {string} userId - ID del usuario a verificar
     * @returns {Promise<Object>} - Datos del usuario verificado
     */
    async verifyToken(userId) {
        const { data: userData, error } = await this.supabase
            .from('users')
            .select('id, nomada_id, username, email, bio')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            throw new Error('Token inválido o usuario no encontrado');
        }

        return {
            valid: true,
            user: userData
        };
    }

    /**
     * Solicitar restablecimiento de contraseña
     * @param {string} email - Email del usuario
     * @returns {Promise<Object>} - Confirmación de envío de correo
     */
    async resetPassword(email) {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: process.env.PASSWORD_RESET_URL || 'http://localhost:3000/reset-password',
        });

        if (error) {
            throw new Error(`Error al solicitar restablecimiento: ${error.message}`);
        }

        return {
            success: true,
            message: 'Se ha enviado un correo con instrucciones para restablecer la contraseña'
        };
    }

    async loginWithEmail(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(error.message);
        }

        // Devolver datos de sesión y user
        return {
            success: true,
            session: data.session,
            user: data.user
        };
    }

    /**
     * Verificar si un email está disponible para registro
     * @param {string} email - Email a verificar
     * @returns {Promise<Object>} - Resultado de la verificación (falla si ya está registrado)
     */
    async checkEmailAvailable(email) {
        try {
            const { data: existingUser, error } = await this.supabase
                .from('users')
                .select('id, email')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw new Error(`Error al verificar email: ${error.message}`);
            }

            // Si el usuario existe, lanzar error
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }

            // Si llegamos aquí, el email está disponible
            return {
                available: true,
                email: email.toLowerCase().trim()
            };
        } catch (error) {
            console.error('Error verificando disponibilidad de email:', error);
            throw error; // Re-lanzar el error para que la ruta lo maneje
        }
    }
}

module.exports = AuthService;   