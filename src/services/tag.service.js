'use strict';

const { supabase } = require('../db/supabase');

/**
 * Servicio para gestionar las etiquetas asociadas a los estados de ánimo
 */
class TagService {
    /**
     * Guarda nuevas etiquetas en la base de datos
     * @param {Object} tagData - Datos de las etiquetas
     * @param {Array} tagData.tags - Lista de etiquetas a guardar
     * @param {string} tagData.userId - ID del usuario
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
}

module.exports = new TagService(); 