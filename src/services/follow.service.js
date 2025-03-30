/**
 * Servicio para gestionar las relaciones de seguimiento entre usuarios
 */
class FollowService {
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
        console.log('FollowService inicializado con cliente Supabase');
    }

    /**
     * Seguir a un usuario
     * @param {string} followerId - ID del usuario que sigue
     * @param {string} followingId - ID del usuario a seguir
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async followUser(followerId, followingId) {
        // Verificar que no sea el mismo usuario
        if (followerId === followingId) {
            throw new Error('No puedes seguirte a ti mismo');
        }

        // Verificar que el usuario a seguir existe
        const { data: targetUser, error: userError } = await this.supabase
            .from('users')
            .select('id')
            .eq('id', followingId)
            .single();

        if (userError || !targetUser) {
            throw new Error('El usuario que intentas seguir no existe');
        }

        // Verificar si ya lo sigue
        const { data: existingFollow } = await this.supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .maybeSingle();

        if (existingFollow) {
            return {
                success: true,
                message: 'Ya sigues a este usuario',
                isNew: false
            };
        }

        // Crear relación de seguimiento
        const { error: followError } = await this.supabase
            .from('user_follows')
            .insert({
                follower_id: followerId,
                following_id: followingId
            });

        if (followError) {
            throw new Error(`Error al seguir al usuario: ${followError.message}`);
        }

        return {
            success: true,
            message: 'Usuario seguido correctamente',
            isNew: true
        };
    }

    /**
     * Dejar de seguir a un usuario
     * @param {string} followerId - ID del usuario que deja de seguir
     * @param {string} followingId - ID del usuario a dejar de seguir
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async unfollowUser(followerId, followingId) {
        // Verificar que exista la relación
        const { data: existingFollow } = await this.supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .maybeSingle();

        if (!existingFollow) {
            return {
                success: true,
                message: 'No sigues a este usuario'
            };
        }

        // Eliminar relación
        const { error: unfollowError } = await this.supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (unfollowError) {
            throw new Error(`Error al dejar de seguir al usuario: ${unfollowError.message}`);
        }

        return {
            success: true,
            message: 'Has dejado de seguir al usuario'
        };
    }

    /**
     * Obtener seguidores de un usuario
     * @param {string} userId - ID del usuario
     * @param {number} limit - Límite de resultados
     * @param {number} offset - Desplazamiento para paginación
     * @returns {Promise<Array>} - Lista de seguidores
     */
    async getFollowers(userId, limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('user_follows')
            .select(`
        follower:follower_id(
          id, username, full_name, bio
        )
      `)
            .eq('following_id', userId)
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(`Error al obtener seguidores: ${error.message}`);
        }

        // Extraer usuarios seguidores de la respuesta anidada
        return data.map(item => item.follower);
    }

    /**
     * Obtener usuarios seguidos por un usuario
     * @param {string} userId - ID del usuario
     * @param {number} limit - Límite de resultados
     * @param {number} offset - Desplazamiento para paginación
     * @returns {Promise<Array>} - Lista de usuarios seguidos
     */
    async getFollowing(userId, limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('user_follows')
            .select(`
        following:following_id(
          id, username, full_name, bio
        )
      `)
            .eq('follower_id', userId)
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(`Error al obtener usuarios seguidos: ${error.message}`);
        }

        // Extraer usuarios seguidos de la respuesta anidada
        return data.map(item => item.following);
    }

    /**
     * Verificar si un usuario sigue a otro
     * @param {string} followerId - ID del posible seguidor
     * @param {string} followingId - ID del posible seguido
     * @returns {Promise<boolean>} - true si lo sigue, false si no
     */
    async isFollowing(followerId, followingId) {
        const { data, error } = await this.supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .maybeSingle();

        if (error) {
            throw new Error(`Error al verificar relación: ${error.message}`);
        }

        return !!data;
    }
}

module.exports = FollowService; 