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
    }    /**
     * Envía un correo de confirmación de suscripción
     * @param {string} email - Correo del suscriptor
     * @returns {Promise<Object>} Resultado del envío
     * @private
     */
    async sendConfirmationEmail(email) {
        const subject = '✈️ ¡Bienvenido a Nómada! Confirmación de suscripción';

        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Nómada</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                        ✈️ Nómada
                                    </h1>
                                    <p style="color: #e8f0fe; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">
                                        Tu compañero de viaje ideal
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <div style="display: inline-block; background-color: #e8f5e8; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 40px; margin-bottom: 20px;">
                                            🎉
                                        </div>
                                        <h2 style="color: #2c3e50; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
                                            ¡Gracias por unirte a nosotros!
                                        </h2>
                                        <p style="color: #7f8c8d; font-size: 16px; margin: 0;">
                                            Has sido registrado correctamente en nuestra comunidad de viajeros
                                        </p>
                                    </div>
                                    
                                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea;">
                                        <h3 style="color: #2c3e50; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                                            🌍 ¿Qué puedes esperar?
                                        </h3>
                                        <ul style="color: #34495e; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li>📧 <strong>Consejos de viaje exclusivos</strong> directamente en tu bandeja</li>
                                            <li>🗺️ <strong>Destinos recomendados</strong> cuidadosamente seleccionados</li>
                                            <li>💡 <strong>Tips y trucos</strong> para viajar como un experto</li>
                                            <li>🎁 <strong>Ofertas especiales</strong> y promociones únicas</li>
                                        </ul>
                                    </div>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <p style="color: #7f8c8d; font-size: 14px; line-height: 1.6; margin: 0;">
                                            <strong>Email confirmado:</strong> <span style="color: #667eea; font-weight: 600;">${email}</span>
                                        </p>
                                    </div>
                                    
                                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                        <p style="color: #856404; font-size: 14px; margin: 0; text-align: center;">
                                            💌 <strong>¡Tu primer newsletter llegará muy pronto!</strong><br>
                                            Mantente atento a tu bandeja de entrada
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                                    <p style="color: #bdc3c7; font-size: 14px; margin: 0 0 15px 0;">
                                        ¿No solicitaste esta suscripción?
                                    </p>
                                    <p style="color: #95a5a6; font-size: 12px; line-height: 1.6; margin: 0;">
                                        Puedes darte de baja en cualquier momento haciendo clic en el enlace de cancelación que aparecerá en nuestros correos futuros.
                                    </p>
                                    <div style="margin: 20px 0; padding: 15px 0; border-top: 1px solid #34495e;">
                                        <p style="color: #ecf0f1; font-size: 16px; font-weight: 600; margin: 0;">
                                            ¡Felices viajes! 🌟
                                        </p>
                                        <p style="color: #bdc3c7; font-size: 14px; margin: 5px 0 0 0;">
                                            — El equipo de Nómada
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        return emailService.sendEmail({
            subject,
            html,
            to: email // Enviar al suscriptor
        });
    }
}

module.exports = new NewsletterService(); 