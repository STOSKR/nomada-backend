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
     * @param {string} moodData.timestamp - Fecha y hora del registro (opcional)
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
}

module.exports = new MoodService(); 