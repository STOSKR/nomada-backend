/**
 * Servicio para la gestión de fotos
 */
const CloudinaryService = require('./cloudinary.service');

class PhotoService {
    /**
     * Constructor
     * @param {Object} supabase - Cliente de Supabase
     */
    constructor(supabase) {
        this.supabase = supabase;
        this.cloudinary = new CloudinaryService();
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
        place_id,
        position
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error al obtener fotos del usuario:', error);
            throw new Error('Error al obtener las fotos');
        }

        // Optimizar URLs de las imágenes para la vista de listado
        if (data && data.length > 0) {
            data.forEach(photo => {
                if (photo.public_url && photo.public_url.includes('cloudinary.com')) {
                    try {
                        const publicId = this.cloudinary.extractPublicId(photo.public_url);
                        photo.optimized_url = this.cloudinary.getOptimizedUrl(publicId, {
                            width: 600,
                            crop: 'scale',
                            fetch_format: 'auto',
                            quality: 'auto'
                        });
                    } catch (error) {
                        console.warn('No se pudo optimizar la URL de la foto:', error);
                        photo.optimized_url = photo.public_url;
                    }
                } else {
                    photo.optimized_url = photo.public_url;
                }
            });
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
        position,
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

        // Generar URLs optimizadas para diferentes tamaños
        if (photo.public_url && photo.public_url.includes('cloudinary.com')) {
            try {
                const publicId = this.cloudinary.extractPublicId(photo.public_url);
                const variants = this.cloudinary.generateImageVariants(publicId);
                photo.variants = variants;
            } catch (error) {
                console.warn('No se pudieron generar variantes para la foto:', error);
            }
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
            mime_type,
            place_id,
            position
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
                mime_type: mime_type || null,
                place_id: place_id || null,
                position: position || null
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
        const allowedFields = ['filename', 'caption', 'place_id', 'position'];

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
            .select('id, filename, public_url, caption, place_id, position')
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

        // Intentar eliminar el archivo de Cloudinary
        try {
            if (photo.public_url && photo.public_url.includes('cloudinary.com')) {
                const publicId = this.cloudinary.extractPublicId(photo.public_url);
                await this.cloudinary.deleteImage(publicId);
            }
        } catch (storageError) {
            console.warn('Error al eliminar el archivo de Cloudinary:', storageError);
            // No lanzamos error ya que la foto ya se eliminó de la BD
        }

        return true;
    }

    /**
     * Obtiene una URL firmada para subir una foto a Cloudinary
     * @param {string} filename - Nombre del archivo
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>} - Datos para la subida
     */
    async getUploadUrl(filename, userId) {
        if (!filename) {
            throw new Error('Nombre de archivo requerido');
        }

        // Sanitizar el nombre del archivo
        const sanitizedFilename = this.sanitizeFilename(filename);

        try {
            // Generar firma para subida directa a Cloudinary
            const folder = `nomada/users/${userId}/photos`;
            const signatureData = this.cloudinary.generateUploadSignature({ folder });
            
            // Construir datos de respuesta
            return {
                signedUrl: null, // No se usa en subida directa a Cloudinary
                path: `${folder}/${sanitizedFilename}`,
                publicUrl: `https://res.cloudinary.com/${signatureData.cloudName}/image/upload/v1/${folder}/${sanitizedFilename}`,
                key: `${folder}/${sanitizedFilename}`,
                uploadData: {
                    signature: signatureData.signature,
                    timestamp: signatureData.timestamp,
                    cloudName: signatureData.cloudName,
                    apiKey: signatureData.apiKey,
                    folder: signatureData.folder,
                    transformation: signatureData.transformation,
                    eager: signatureData.eager
                }
            };
        } catch (error) {
            console.error('Error en la generación de firma para Cloudinary:', error);
            throw new Error('Error al procesar la solicitud de subida');
        }
    }

    /**
     * Procesa una foto subida directamente a Cloudinary
     * @param {Object} cloudinaryData - Datos de respuesta de Cloudinary
     * @param {string} userId - ID del usuario
     * @param {Object} additionalData - Datos adicionales (place_id, position)
     * @returns {Promise<Object>} - Foto registrada
     */
    async processCloudinaryUpload(cloudinaryData, userId, additionalData = {}) {
        try {
            // Extraer datos relevantes de la respuesta de Cloudinary
            const photoData = {
                filename: cloudinaryData.original_filename || 'uploaded_image',
                public_url: cloudinaryData.secure_url,
                width: cloudinaryData.width,
                height: cloudinaryData.height,
                size: cloudinaryData.bytes,
                mime_type: cloudinaryData.resource_type === 'image' ? `image/${cloudinaryData.format}` : 'application/octet-stream',
                ...additionalData
            };

            // Crear el registro en la base de datos
            return await this.createPhoto(photoData, userId);
        } catch (error) {
            console.error('Error al procesar subida de Cloudinary:', error);
            throw new Error(`Error al procesar imagen: ${error.message}`);
        }
    }

    /**
     * Sube una imagen directamente a Cloudinary y la registra
     * @param {Buffer|string} fileData - Archivo de imagen (buffer) o ruta temporal
     * @param {string} filename - Nombre original del archivo
     * @param {string} userId - ID del usuario
     * @param {Object} additionalData - Datos adicionales (place_id, position)
     * @returns {Promise<Object>} - Foto registrada
     */
    async uploadAndRegisterPhoto(fileData, filename, userId, additionalData = {}) {
        try {
            // Verificar si los parámetros son válidos
            if (!fileData) {
                throw new Error('El archivo de imagen es requerido');
            }
            
            if (!userId) {
                throw new Error('El ID de usuario es requerido');
            }

            // Añadir logs para depuración
            console.log('Iniciando subida de foto con:');
            console.log('- Tipo de fileData:', typeof fileData);
            console.log('- Es Buffer:', Buffer.isBuffer(fileData));
            console.log('- Filename:', filename);
            console.log('- UserID:', userId);
            console.log('- Datos adicionales:', JSON.stringify(additionalData));

            // Generar un nombre seguro para el archivo
            const safeFilename = this.sanitizeFilename(filename);
            
            // Configuración para Cloudinary
            const uploadOptions = {
                folder: `nomada/users/${userId}/photos`,
                public_id: safeFilename.split('.')[0],
                // Optimizaciones
                quality: 'auto',
                fetch_format: 'auto'
            };
            
            console.log('Configuración de subida a Cloudinary:', uploadOptions);
            
            // Subir a Cloudinary con optimizaciones aplicadas
            const uploadResult = await this.cloudinary.uploadImage(fileData, uploadOptions);

            console.log('Imagen subida correctamente a Cloudinary:', uploadResult.secure_url);

            // Registrar en base de datos
            const photoData = {
                filename: filename || `uploaded_${Date.now()}`,
                public_url: uploadResult.secure_url,
                width: uploadResult.width,
                height: uploadResult.height,
                size: uploadResult.bytes,
                mime_type: `image/${uploadResult.format}`,
                ...additionalData
            };

            return await this.createPhoto(photoData, userId);
        } catch (error) {
            console.error('Error en subida y registro de foto:', error);
            throw new Error(`Error al subir y registrar foto: ${error.message}`);
        }
    }

    /**
     * Sanitiza un nombre de archivo para almacenamiento seguro
     * @param {string} filename - Nombre del archivo original
     * @returns {string} - Nombre de archivo sanitizado
     */
    sanitizeFilename(filename) {
        // Verificar si filename es undefined o no es un string
        if (!filename || typeof filename !== 'string') {
            console.warn('Nombre de archivo inválido:', filename);
            // Generar un nombre de archivo predeterminado con timestamp
            return `file_${Date.now()}.jpg`;
        }

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