'use strict';

const { supabase } = require('../db/supabase');
const emailService = require('./email.service');

/**
 * Servicio para gestionar las suscripciones al newsletter
 */
class NewsletterService {
    /**
     * Suscribe un correo electrónico al newsletter
     * @param {string} email - Correo electrónico del suscriptor
     * @returns {Promise<Object>} Resultado de la operación
     */
    async subscribeToNewsletter(email) {
        try {
            // Verificar si el correo ya está suscrito
            const { data: existingEmail } = await supabase
                .from('newsletter_subscribers')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingEmail) {
                return { success: false, message: 'Este correo ya está suscrito al newsletter' };
            }

            // Registrar nuevo suscriptor
            const { data, error } = await supabase
                .from('newsletter_subscribers')
                .insert({
                    email: email,
                    subscribed_at: new Date().toISOString(),
                    is_active: true
                })
                .select();

            if (error) throw error;

            // Enviar correo de confirmación
            try {
                await this.sendConfirmationEmail(email);
            } catch (emailError) {
                console.error('Error al enviar correo de confirmación:', emailError);
                // No interrumpimos el flujo principal si falla el envío del correo
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al suscribir al newsletter:', error);
            throw new Error(`Error al suscribir al newsletter: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los suscriptores del newsletter
     * @param {Object} options - Opciones de consulta
     * @param {number} options.limit - Número máximo de resultados
     * @param {number} options.offset - Desplazamiento para paginación
     * @returns {Promise<Array>} Lista de suscriptores
     */
    async getAllSubscribers({ limit = 50, offset = 0 } = {}) {
        try {
            const { data, error } = await supabase
                .from('newsletter_subscribers')
                .select('*')
                .order('subscribed_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al obtener suscriptores:', error);
            throw new Error(`Error al obtener suscriptores: ${error.message}`);
        }
    }

    /**
     * Da de baja un suscriptor del newsletter
     * @param {string} email - Correo electrónico del suscriptor
     * @returns {Promise<Object>} Resultado de la operación
     */
    async unsubscribe(email) {
        try {
            const { data, error } = await supabase
                .from('newsletter_subscribers')
                .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
                .eq('email', email)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                return { success: false, message: 'Este correo no está suscrito al newsletter' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al dar de baja del newsletter:', error);
            throw new Error(`Error al dar de baja del newsletter: ${error.message}`);
        }
    }

    /**
     * Envía un correo de confirmación de suscripción
     * @param {string} email - Correo del suscriptor
     * @returns {Promise<Object>} Resultado del envío
     * @private
     */
    async sendConfirmationEmail(email) {
        const subject = 'Confirmación de suscripción al Newsletter de Nómada';

        const html = `
            <h2>¡Gracias por suscribirte al Newsletter de Nómada!</h2>
            <p>Has sido registrado correctamente en nuestra lista de distribución.</p>
            <p>Te mantendremos informado sobre las últimas novedades, consejos de viaje y destinos recomendados.</p>
            <p>Si no solicitaste esta suscripción, puedes darte de baja en cualquier momento haciendo clic en el enlace de cancelación que aparecerá en nuestros correos.</p>
            <p>Saludos,<br>El equipo de Nómada</p>
        `;

        return emailService.sendEmail({
            subject,
            html,
            to: email // Enviar al suscriptor
        });
    }
}

module.exports = new NewsletterService(); 