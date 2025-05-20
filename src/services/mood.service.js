'use strict';

const { supabase } = require('../db/supabase');
const emailService = require('./email.service');

/**
 * Servicio para gestionar los estados de ánimo de los usuarios
 */
class MoodService {
    /**
     * Guarda un nuevo estado de ánimo en la base de datos
     * @param {Object} moodData - Datos del estado de ánimo
     * @param {string} moodData.moodType - Tipo de estado de ánimo
     * @param {string} moodData.userId - ID del usuario
     * @param {string} moodData.timestamp - Fecha y hora del registro
     * @returns {Promise<Object>} Resultado de la operación con el ID del mood creado
     */
    async saveMood(moodData) {
        try {
            const { data, error } = await supabase
                .from('moods')
                .insert({
                    mood_type: moodData.moodType,
                    user_id: moodData.userId,
                    created_at: moodData.timestamp || new Date().toISOString()
                })
                .select();

            if (error) throw error;

            // Notificación por correo (opcional)
            try {
                if (data && data.length > 0) {
                    await emailService.sendMoodNotification(data[0]);
                }
            } catch (emailError) {
                console.error('Error al enviar notificación por correo:', emailError);
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar estado de ánimo:', error);
            throw new Error(`Error al guardar estado de ánimo: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los estados de ánimo registrados
     * @param {Object} options - Opciones de consulta
     * @param {number} options.limit - Número máximo de resultados
     * @param {number} options.offset - Desplazamiento para paginación
     * @param {string} options.userId - Filtrar por ID de usuario (opcional)
     * @returns {Promise<Array>} Lista de estados de ánimo
     */
    async getAllMoods({ limit = 50, offset = 0, userId = null } = {}) {
        try {
            let query = supabase
                .from('moods')
                .select('*')
                .order('created_at', { ascending: false });

            // Filtrar por usuario si se proporciona un ID
            if (userId) {
                query = query.eq('user_id', userId);
            }

            // Aplicar paginación
            query = query.range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al obtener estados de ánimo:', error);
            throw new Error(`Error al obtener estados de ánimo: ${error.message}`);
        }
    }

    /**
     * Obtiene un estado de ánimo por su ID
     * @param {number} id - ID del estado de ánimo
     * @returns {Promise<Object>} Estado de ánimo
     */
    async getMoodById(id) {
        try {
            const { data, error } = await supabase
                .from('moods')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error(`Error al obtener estado de ánimo con ID ${id}:`, error);
            throw new Error(`Error al obtener estado de ánimo: ${error.message}`);
        }
    }
}

module.exports = new MoodService(); 