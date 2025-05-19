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
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'tu-email@gmail.com',
                to: 'shiyicheng13@gmail.com', // Destinatario fijo según requerimiento
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
     * Envía una notificación de nuevo feedback
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
}

module.exports = new EmailService(); 