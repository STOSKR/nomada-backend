'use strict';

const { supabase } = require('../db/supabase');

/**
 * Servicio para gestionar las etiquetas asociadas a los estados de ánimo
 */
class TagService {
    /**
     * Guarda nuevas etiquetas en la base de datos asociadas a un mood
     * @param {Object} tagData - Datos de las etiquetas
     * @param {Array} tagData.tags - Lista de etiquetas a guardar
     * @param {string} tagData.userId - ID del usuario
     * @param {number} tagData.moodId - ID del estado de ánimo asociado
     * @param {string} tagData.timestamp - Fecha y hora del registro (opcional)
     * @returns {Promise<Object>} Resultado de la operación
     */
    async saveTags(tagData) {
        try {
            if (!tagData.tags || !Array.isArray(tagData.tags) || tagData.tags.length === 0) {
                return { success: true, data: [] };
            }

            // Preparar datos para inserción masiva
            const tagsToInsert = tagData.tags.map(tag => ({
                tag_name: tag,
                user_id: tagData.userId,
                mood_id: tagData.moodId,
                created_at: tagData.timestamp || new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('tags')
                .insert(tagsToInsert)
                .select();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar etiquetas:', error);
            throw new Error(`Error al guardar etiquetas: ${error.message}`);
        }
    }

    /**
     * Obtiene todas las etiquetas registradas
     * @param {Object} options - Opciones de consulta
     * @param {number} options.limit - Número máximo de resultados
     * @param {number} options.offset - Desplazamiento para paginación
     * @param {number} options.moodId - Filtrar por ID de estado de ánimo (opcional)
     * @returns {Promise<Array>} Lista de etiquetas
     */
    async getAllTags({ limit = 50, offset = 0, moodId = null } = {}) {
        try {
            let query = supabase
                .from('tags')
                .select('*')
                .order('created_at', { ascending: false });

            // Filtrar por estado de ánimo si se proporciona un ID
            if (moodId) {
                query = query.eq('mood_id', moodId);
            }

            // Aplicar paginación
            query = query.range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al obtener etiquetas:', error);
            throw new Error(`Error al obtener etiquetas: ${error.message}`);
        }
    }

    /**
     * Obtiene todas las etiquetas únicas registradas en el sistema
     * @returns {Promise<Array>} Lista de etiquetas únicas
     */
    async getUniqueTags() {
        try {
            const { data, error } = await supabase
                .rpc('get_unique_tags');

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al obtener etiquetas únicas:', error);
            throw new Error(`Error al obtener etiquetas únicas: ${error.message}`);
        }
    }
}

module.exports = new TagService(); 