'use strict';

const { supabase } = require('../db/supabase');
const emailService = require('./email.service');

/**
 * Servicio para gestionar el feedback de los usuarios
 */
class FeedbackService {
    /**
     * Guarda un nuevo feedback en la base de datos
     * @param {Object} feedback - Datos del feedback
     * @param {string} feedback.selectedMood - Estado de ánimo seleccionado
     * @param {Array} feedback.selectedTags - Etiquetas seleccionadas
     * @param {string} feedback.feedback - Comentario de texto
     * @param {string} feedback.selectedMessageType - Tipo de mensaje seleccionado
     * @param {string} feedback.timestamp - Fecha y hora del feedback
     * @param {string} feedback.userId - ID del usuario
     * @returns {Promise<Object>} Resultado de la operación
     */
    async saveFeedback(feedbackData) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .insert({
                    mood: feedbackData.selectedMood,
                    tags: feedbackData.selectedTags,
                    comment: feedbackData.feedback || null,
                    message_type: feedbackData.selectedMessageType || null,
                    created_at: feedbackData.timestamp,
                    user_id: feedbackData.userId
                })
                .select();

            if (error) throw error;

            // Enviar notificación por correo electrónico
            try {
                if (data && data.length > 0) {
                    await emailService.sendFeedbackNotification(data[0]);
                }
            } catch (emailError) {
                // Log del error pero no interrumpimos la operación principal
                console.error('Error al enviar notificación por correo:', emailError);
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar feedback:', error);
            throw new Error(`Error al guardar feedback: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los feedback guardados
     * @param {Object} options - Opciones de consulta
     * @param {number} options.limit - Número máximo de resultados
     * @param {number} options.offset - Desplazamiento para paginación
     * @returns {Promise<Array>} Lista de feedback
     */
    async getAllFeedback({ limit = 50, offset = 0 } = {}) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al obtener feedback:', error);
            throw new Error(`Error al obtener feedback: ${error.message}`);
        }
    }
}

module.exports = new FeedbackService(); 