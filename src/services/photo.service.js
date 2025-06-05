/**
 * Servicio para gestión de fotos
 */
const CloudinaryService = require('./cloudinary.service');

class PhotoService {
    constructor(supabase) {
        this.supabase = supabase;
        this.cloudinary = new CloudinaryService();
    }

    /**
     * Limpiar nombre de archivo para uso seguro
     * @param {string} filename - Nombre del archivo
     * @returns {string} Nombre limpio
     */
    sanitizeFilename(filename) {
        if (!filename) return `file_${Date.now()}.jpg`;
        
        // Remover caracteres especiales y espacios
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    /**
     * Obtener fotos del usuario
     * @param {string} userId - ID del usuario
     * @param {Object} options - Opciones de paginación
     * @returns {Array} Lista de fotos
     */
    async getUserPhotos(userId, options = {}) {
        const { limit = 20, offset = 0 } = options;

        try {
            const { data, error } = await this.supabase
                .from('place_photos')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                throw new Error(`Error al obtener fotos del usuario: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            throw new Error(`Error en getUserPhotos: ${error.message}`);
        }
    }

    /**
     * Obtener una foto específica
     * @param {string} photoId - ID de la foto
     * @param {string} userId - ID del usuario (para verificar permisos)
     * @returns {Object} Datos de la foto
     */
    async getPhoto(photoId, userId) {
        try {
            const { data, error } = await this.supabase
                .from('place_photos')
                .select('*')
                .eq('id', photoId)
                .eq('user_id', userId)
                .single();

            if (error) {
                throw new Error(`Error al obtener foto: ${error.message}`);
            }

            return data;
        } catch (error) {
            throw new Error(`Error en getPhoto: ${error.message}`);
        }
    }

    /**
     * Actualizar metadatos de una foto
     * @param {string} photoId - ID de la foto
     * @param {string} userId - ID del usuario
     * @param {Object} updates - Datos a actualizar
     * @returns {Object} Foto actualizada
     */
    async updatePhoto(photoId, userId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('place_photos')
                .update(updates)
                .eq('id', photoId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                throw new Error(`Error al actualizar foto: ${error.message}`);
            }

            return data;
        } catch (error) {
            throw new Error(`Error en updatePhoto: ${error.message}`);
        }
    }

    /**
     * Eliminar una foto
     * @param {string} photoId - ID de la foto
     * @param {string} userId - ID del usuario
     * @returns {boolean} Resultado de la eliminación
     */
    async deletePhoto(photoId, userId) {
        try {
            // Primero obtener la foto para conseguir el public_id de Cloudinary
            const photo = await this.getPhoto(photoId, userId);
            
            // Eliminar de Cloudinary si tiene public_id
            if (photo.cloudinary_public_id) {
                await this.cloudinary.deleteImage(photo.cloudinary_public_id);
            }

            // Eliminar de la base de datos
            const { error } = await this.supabase
                .from('place_photos')
                .delete()
                .eq('id', photoId)
                .eq('user_id', userId);

            if (error) {
                throw new Error(`Error al eliminar foto de la base de datos: ${error.message}`);
            }

            return true;
        } catch (error) {
            throw new Error(`Error en deletePhoto: ${error.message}`);
        }
    }

    /**
     * Obtener fotos de un lugar específico
     * @param {string} placeId - ID del lugar
     * @returns {Array} Lista de fotos del lugar
     */
    async getPlacePhotos(placeId) {
        try {
            const { data, error } = await this.supabase
                .from('place_photos')
                .select('public_url, order_index')
                .eq('place_id', placeId)
                .order('order_index', { ascending: true });

            if (error) {
                throw new Error(`Error al obtener fotos del lugar: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            throw new Error(`Error en getPlacePhotos: ${error.message}`);
        }
    }

    /**
     * Crear una nueva entrada de foto en la base de datos
     * @param {Object} photoData - Datos de la foto
     * @returns {Object} Foto creada
     */
    async createPhoto(photoData) {
        try {
            const { data, error } = await this.supabase
                .from('place_photos')
                .insert(photoData)
                .select()
                .single();

            if (error) {
                throw new Error(`Error al crear foto: ${error.message}`);
            }

            return data;
        } catch (error) {
            throw new Error(`Error en createPhoto: ${error.message}`);
        }
    }
}

module.exports = PhotoService;
