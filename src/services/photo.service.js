/**
 * Servicio para la gestión de fotos
 */
class PhotoService {
    /**
     * Constructor
     * @param {Object} supabase - Cliente de Supabase
     */
    constructor(supabase) {
        this.supabase = supabase;
        this.storage = supabase.storage;
    }

    /**
     * Obtiene fotos del usuario
     * @param {string} userId - ID del usuario
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Array>} - Lista de fotos
     */
    async getUserPhotos(userId, options = {}) {
        const { limit = 20, offset = 0 } = options;

        const { data, error } = await this.supabase
            .from('photos')
            .select(`
        id,
        filename,
        public_url,
        width,
        height,
        size,
        mime_type,
        created_at,
        place_id
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error al obtener fotos del usuario:', error);
            throw new Error('Error al obtener las fotos');
        }

        return data || [];
    }

    /**
     * Obtiene una foto específica
     * @param {string} photoId - ID de la foto
     * @param {string} userId - ID del usuario solicitante
     * @returns {Promise<Object>} - Detalles de la foto
     */
    async getPhoto(photoId, userId) {
        const { data: photo, error } = await this.supabase
            .from('photos')
            .select(`
        id,
        filename,
        public_url,
        width,
        height,
        size,
        mime_type,
        created_at,
        place_id,
        caption,
        user_id
      `)
            .eq('id', photoId)
            .single();

        if (error || !photo) {
            console.error('Error al obtener foto:', error);
            throw new Error('Foto no encontrada');
        }

        // Verificar permisos si la foto está en un lugar
        if (photo.place_id) {
            const { data: place } = await this.supabase
                .from('places')
                .select('route_id')
                .eq('id', photo.place_id)
                .single();

            if (place) {
                const { data: route } = await this.supabase
                    .from('routes')
                    .select('user_id, is_public')
                    .eq('id', place.route_id)
                    .single();

                // Si la ruta es privada y el usuario no es el propietario
                if (route && !route.is_public && route.user_id !== userId && photo.user_id !== userId) {
                    throw new Error('No tienes permiso para ver esta foto');
                }
            }
        } else if (photo.user_id !== userId) {
            // Si la foto no está en un lugar, solo el propietario puede verla
            throw new Error('No tienes permiso para ver esta foto');
        }

        return photo;
    }

    /**
     * Registra una nueva foto en la base de datos
     * @param {Object} photoData - Datos de la foto
     * @param {string} userId - ID del usuario propietario
     * @returns {Promise<Object>} - Foto creada
     */
    async createPhoto(photoData, userId) {
        const {
            filename,
            public_url,
            width,
            height,
            size,
            mime_type
        } = photoData;

        // Validar datos mínimos
        if (!filename || !public_url) {
            throw new Error('Datos de foto incompletos');
        }

        // Crear el registro de la foto
        const { data: photo, error } = await this.supabase
            .from('photos')
            .insert({
                user_id: userId,
                filename,
                public_url,
                width: width || null,
                height: height || null,
                size: size || null,
                mime_type: mime_type || null
            })
            .select('id, filename, public_url')
            .single();

        if (error) {
            console.error('Error al registrar foto:', error);
            throw new Error('Error al registrar la foto: ' + error.message);
        }

        return photo;
    }

    /**
     * Actualiza los metadatos de una foto
     * @param {string} photoId - ID de la foto
     * @param {Object} updateData - Datos a actualizar
     * @param {string} userId - ID del usuario que realiza la actualización
     * @returns {Promise<Object>} - Foto actualizada
     */
    async updatePhoto(photoId, updateData, userId) {
        // Verificar que la foto exista y pertenezca al usuario
        const { data: photo, error: checkError } = await this.supabase
            .from('photos')
            .select('user_id')
            .eq('id', photoId)
            .single();

        if (checkError || !photo) {
            console.error('Error al verificar foto:', checkError);
            throw new Error('Foto no encontrada');
        }

        if (photo.user_id !== userId) {
            throw new Error('No tienes permiso para modificar esta foto');
        }

        // Campos permitidos para actualización
        const allowedFields = ['filename', 'caption'];

        // Filtrar solo los campos permitidos
        const filteredData = Object.keys(updateData)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        // Actualizar la foto
        const { data: updatedPhoto, error } = await this.supabase
            .from('photos')
            .update(filteredData)
            .eq('id', photoId)
            .select('id, filename, public_url, caption')
            .single();

        if (error) {
            console.error('Error al actualizar foto:', error);
            throw new Error('Error al actualizar la foto: ' + error.message);
        }

        return updatedPhoto;
    }

    /**
     * Elimina una foto
     * @param {string} photoId - ID de la foto
     * @param {string} userId - ID del usuario que solicita la eliminación
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    async deletePhoto(photoId, userId) {
        // Verificar que la foto exista y pertenezca al usuario
        const { data: photo, error: checkError } = await this.supabase
            .from('photos')
            .select('user_id, filename, public_url')
            .eq('id', photoId)
            .single();

        if (checkError || !photo) {
            console.error('Error al verificar foto:', checkError);
            throw new Error('Foto no encontrada');
        }

        if (photo.user_id !== userId) {
            throw new Error('No tienes permiso para eliminar esta foto');
        }

        // Eliminar la foto de la base de datos
        const { error } = await this.supabase
            .from('photos')
            .delete()
            .eq('id', photoId);

        if (error) {
            console.error('Error al eliminar foto de la base de datos:', error);
            throw new Error('Error al eliminar la foto');
        }

        // Intentar eliminar el archivo de Storage
        try {
            // Extraer la ruta del archivo desde la URL
            const publicUrl = photo.public_url;
            if (publicUrl && publicUrl.includes('storage/v1/object/public/')) {
                const bucketPath = publicUrl.split('storage/v1/object/public/')[1];
                const [bucket, ...pathParts] = bucketPath.split('/');
                const path = pathParts.join('/');

                if (bucket && path) {
                    const { error: storageError } = await this.storage
                        .from(bucket)
                        .remove([path]);

                    if (storageError) {
                        console.warn('No se pudo eliminar el archivo de almacenamiento:', storageError);
                        // No lanzamos error ya que la foto ya se eliminó de la BD
                    }
                }
            }
        } catch (storageError) {
            console.warn('Error al procesar eliminación del archivo:', storageError);
            // No lanzamos error ya que la foto ya se eliminó de la BD
        }

        return true;
    }

    /**
     * Obtiene una URL firmada para subir una foto
     * @param {string} filename - Nombre del archivo
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>} - URL firmada y datos para la subida
     */
    async getUploadUrl(filename, userId) {
        if (!filename) {
            throw new Error('Nombre de archivo requerido');
        }

        // Sanitizar el nombre del archivo
        const sanitizedFilename = this.sanitizeFilename(filename);

        // Crear una ruta única para evitar colisiones
        const timestamp = new Date().getTime();
        const uniquePath = `${userId}/${timestamp}_${sanitizedFilename}`;

        // Obtener una URL firmada para subir el archivo
        try {
            const { data, error } = await this.storage
                .from('photos')
                .createSignedUploadUrl(uniquePath);

            if (error) {
                console.error('Error al crear URL firmada:', error);
                throw new Error('Error al generar URL de subida');
            }

            // Construir la URL pública anticipada
            const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/photos/${uniquePath}`;

            return {
                signedUrl: data.signedUrl,
                path: data.path,
                publicUrl,
                key: uniquePath
            };
        } catch (error) {
            console.error('Error en la generación de URL firmada:', error);
            throw new Error('Error al procesar la solicitud de subida');
        }
    }

    /**
     * Sanitiza un nombre de archivo para almacenamiento seguro
     * @param {string} filename - Nombre del archivo original
     * @returns {string} - Nombre de archivo sanitizado
     */
    sanitizeFilename(filename) {
        // Eliminar caracteres no seguros
        let sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Limitar la longitud
        if (sanitized.length > 100) {
            const ext = sanitized.split('.').pop();
            sanitized = sanitized.substring(0, 95) + '.' + ext;
        }

        return sanitized;
    }
}

module.exports = PhotoService; 