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
            console.error('Error: Cliente de Supabase no inicializado');
            throw new Error('Cliente de Supabase no disponible');
        }
        this.supabase = supabase;
        console.log('AuthService inicializado con cliente Supabase');
    }

    /**
     * Registrar un nuevo usuario
     * @param {Object} userData - Datos del usuario a registrar
     * @returns {Promise<Object>} - Usuario registrado y token de sesión
     */
    async signup(userData) {
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
     */
    async login(email, password) {
        const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            throw new Error('Credenciales incorrectas');
        }

        const { data: userData, error: profileError } = await this.supabase
            .from('users')
            .select('id, username, email, full_name, bio')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            throw new Error('Error al obtener datos del usuario');
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
        const { error } = await this.supabase.auth.signOut();

        if (error) {
            throw new Error(`Error al cerrar sesión: ${error.message}`);
        }

        return {
            success: true,
            message: 'Sesión cerrada correctamente'
        };
    }

    /**
     * Verificar token de autenticación
     * @param {string} userId - ID del usuario a verificar
     * @returns {Promise<Object>} - Datos del usuario verificado
     */
    async verifyToken(userId) {
        const { data: userData, error } = await this.supabase
            .from('users')
            .select('id, username, email, full_name, bio')
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
}

module.exports = AuthService; 