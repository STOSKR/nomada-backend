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
     * @param {number} messageData.moodId - ID del estado de ánimo asociado
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
                    mood_id: messageData.moodId,
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

    /**
     * Obtiene todos los mensajes de feedback registrados
     * @param {Object} options - Opciones de consulta
     * @param {number} options.limit - Número máximo de resultados
     * @param {number} options.offset - Desplazamiento para paginación
     * @param {number} options.moodId - Filtrar por ID de estado de ánimo (opcional)
     * @returns {Promise<Array>} Lista de mensajes
     */
    async getAllMessages({ limit = 50, offset = 0, moodId = null } = {}) {
        try {
            let query = supabase
                .from('feedback_messages')
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
            console.error('Error al obtener mensajes de feedback:', error);
            throw new Error(`Error al obtener mensajes de feedback: ${error.message}`);
        }
    }

    /**
     * Obtiene un mensaje de feedback por su ID
     * @param {number} id - ID del mensaje
     * @returns {Promise<Object>} Mensaje de feedback
     */
    async getMessageById(id) {
        try {
            const { data, error } = await supabase
                .from('feedback_messages')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error(`Error al obtener mensaje con ID ${id}:`, error);
            throw new Error(`Error al obtener mensaje: ${error.message}`);
        }
    }
}

module.exports = new MessageService(); 