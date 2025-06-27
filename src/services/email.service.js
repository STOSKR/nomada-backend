'use strict';

const nodemailer = require('nodemailer');

/**
 * Servicio para enviar correos electrónicos
 */
class EmailService {
    constructor() {
        // Configuración del transporte para correos
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'tu-email@gmail.com', // Se debe configurar en .env
                pass: process.env.EMAIL_PASSWORD || 'tu-password-app' // Contraseña de aplicación de Gmail
            }
        });
    }

    /**
     * Envía un correo electrónico de notificación
     * @param {Object} options - Opciones del correo
     * @param {string} options.subject - Asunto del correo
     * @param {string} options.html - Contenido HTML del correo
     * @param {string} [options.to] - Destinatario del correo (opcional)
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: options.to || process.env.EMAIL_USER,
                subject: options.subject,
                html: options.html
            };

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error al enviar correo:', error);
            throw new Error(`Error al enviar correo: ${error.message}`);
        }
    }

    /**
     * Envía una notificación de nuevo feedback (método legacy)
     * @param {Object} feedback - Datos del feedback
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendFeedbackNotification(feedback) {
        const subject = `Nuevo feedback recibido: ${feedback.mood}`;

        let tags = 'Ninguna';
        if (feedback.tags && feedback.tags.length > 0) {
            tags = feedback.tags.join(', ');
        }

        const html = `
            <h2>Se ha recibido un nuevo feedback</h2>
            <p><strong>Estado de ánimo:</strong> ${feedback.mood}</p>
            <p><strong>Etiquetas:</strong> ${tags}</p>
            <p><strong>Tipo de mensaje:</strong> ${feedback.message_type || 'No especificado'}</p>
            <p><strong>Comentario:</strong> ${feedback.comment || 'Sin comentario'}</p>
            <p><strong>Usuario ID:</strong> ${feedback.user_id}</p>
            <p><strong>Fecha:</strong> ${new Date(feedback.created_at).toLocaleString()}</p>
        `;

        return this.sendEmail({ subject, html });
    }

    /**
     * Envía una notificación de nuevo estado de ánimo
     * @param {Object} mood - Datos del estado de ánimo
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendMoodNotification(mood) {
        // Mapear emociones a emojis y colores
        const moodEmojis = {
            'happy': '😊',
            'sad': '😢',
            'excited': '🤩',
            'angry': '😠',
            'calm': '😌',
            'anxious': '😰',
            'tired': '😴',
            'energetic': '⚡',
            'confused': '😕',
            'grateful': '🙏',
            'lonely': '😔',
            'loved': '🥰'
        };

        const moodColors = {
            'happy': '#FFD700',
            'sad': '#4682B4',
            'excited': '#FF6347',
            'angry': '#DC143C',
            'calm': '#98FB98',
            'anxious': '#DDA0DD',
            'tired': '#A9A9A9',
            'energetic': '#FFA500',
            'confused': '#CD853F',
            'grateful': '#9370DB',
            'lonely': '#708090',
            'loved': '#FF69B4'
        };

        const emoji = moodEmojis[mood.mood_type.toLowerCase()] || '😊';
        const color = moodColors[mood.mood_type.toLowerCase()] || '#4A90E2';
        const formattedDate = new Date(mood.created_at).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const subject = `${emoji} Nuevo estado de ánimo: ${mood.mood_type}`;

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Nómada - Nuevo Estado de Ánimo</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="padding: 20px 0; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                            ${emoji} Nómada App
                                        </h1>
                                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                                            Sistema de Seguimiento Emocional
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <div style="text-align: center; margin-bottom: 30px;">
                                            <div style="display: inline-block; background-color: ${color}20; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 36px; margin-bottom: 20px;">
                                                ${emoji}
                                            </div>
                                            <h2 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">
                                                Nuevo Estado de Ánimo Registrado
                                            </h2>
                                        </div>
                                        
                                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 20px 0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #495057; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Estado de Ánimo:</strong>
                                                        <div style="color: ${color}; font-size: 20px; font-weight: 600; margin-top: 5px; text-transform: capitalize;">
                                                            ${emoji} ${mood.mood_type}
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 15px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #495057; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Usuario:</strong>
                                                        <div style="color: #2c3e50; font-size: 16px; margin-top: 5px; font-family: 'Courier New', monospace;">
                                                            ${mood.user_id}
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 15px 0;">
                                                        <strong style="color: #495057; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha y Hora:</strong>
                                                        <div style="color: #2c3e50; font-size: 16px; margin-top: 5px;">
                                                            📅 ${formattedDate}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <div style="text-align: center; margin-top: 30px;">
                                            <a href="${process.env.LOCAL_URL || 'http://localhost:3000'}" 
                                               style="display: inline-block; background-color: ${color}; color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                                                Ver Dashboard
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
                                        <p style="color: #6c757d; margin: 0; font-size: 14px;">
                                            🧭 <strong>Nómada App</strong> - Seguimiento de Estado de Ánimo para Viajeros
                                        </p>
                                        <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 12px;">
                                            Este es un mensaje automático del sistema de notificaciones.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        return this.sendEmail({ subject, html });
    }

    /**
     * Envía una notificación de nuevo mensaje de feedback
     * @param {Object} message - Datos del mensaje
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendMessageNotification(message) {
        const subject = `Nuevo mensaje de feedback recibido`;

        const html = `
            <h2>Se ha recibido un nuevo mensaje de feedback</h2>
            <p><strong>Mensaje:</strong> ${message.message || 'Sin contenido'}</p>
            <p><strong>Tipo de mensaje:</strong> ${message.message_type || 'No especificado'}</p>
            <p><strong>Usuario ID:</strong> ${message.user_id}</p>
            <p><strong>Fecha:</strong> ${new Date(message.created_at).toLocaleString()}</p>
        `;

        return this.sendEmail({ subject, html });
    }
}

module.exports = new EmailService(); 