'use strict';

const { supabase } = require('../db/supabase');
const emailService = require('./email.service');

/**
 * Servicio para gestionar los mensajes de feedback de los usuarios
 */
class MessageService {
    /**
     * Guarda un nuevo mensaje de feedback en la base de datos
     * @param {Object} messageData - Datos del mensaje
     * @param {string} messageData.message - Texto del mensaje de feedback
     * @param {string} messageData.messageType - Tipo de mensaje (opcional)
     * @param {string} messageData.userId - ID del usuario
     * @param {string} messageData.timestamp - Fecha y hora del registro (opcional)
     * @returns {Promise<Object>} Resultado de la operación
     */
    async saveMessage(messageData) {
        try {
            // Si no hay mensaje, no guardamos nada
            if (!messageData.message && !messageData.messageType) {
                return { success: true, data: null };
            }

            const { data, error } = await supabase
                .from('feedback_messages')
                .insert({
                    message: messageData.message || null,
                    message_type: messageData.messageType || null,
                    user_id: messageData.userId,
                    created_at: messageData.timestamp || new Date().toISOString()
                })
                .select();

            if (error) throw error;

            // Notificación por correo (opcional)
            try {
                if (data && data.length > 0) {
                    await emailService.sendMessageNotification(data[0]);
                }
            } catch (emailError) {
                console.error('Error al enviar notificación por correo:', emailError);
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar mensaje de feedback:', error);
            throw new Error(`Error al guardar mensaje de feedback: ${error.message}`);
        }
    }
}

module.exports = new MessageService(); 