const emailService = require('../../src/services/email.service.js');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let mockTransporter;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn()
    };
    
    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
    
    // Mock environment variables
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'test-password';
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>'
      };

      const result = await emailService.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>'
      });
      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id'
      });
    });

    it('should use default recipient when not provided', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const options = {
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>'
      };

      await emailService.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'shiyicheng13@gmail.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>'
      });
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>'
      };

      await expect(emailService.sendEmail(options))
        .rejects.toThrow('Error al enviar correo: SMTP Error');
    });
  });

  describe('sendFeedbackNotification', () => {
    it('should send feedback notification with tags', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const feedback = {
        mood: 'happy',
        tags: ['travel', 'vacation'],
        message_type: 'positive',
        comment: 'Great experience!',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      };

      const result = await emailService.sendFeedbackNotification(feedback);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Nuevo feedback recibido: happy',
          html: expect.stringContaining('Estado de ánimo:</strong> happy'),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle feedback without tags', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const feedback = {
        mood: 'sad',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      };

      const result = await emailService.sendFeedbackNotification(feedback);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Etiquetas:</strong> Ninguna'),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendMoodNotification', () => {
    it('should send mood notification', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const mood = {
        mood_type: 'excited',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      };

      const result = await emailService.sendMoodNotification(mood);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Nuevo estado de ánimo registrado: excited',
          html: expect.stringContaining('Estado de ánimo:</strong> excited'),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendMessageNotification', () => {
    it('should send message notification', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const message = {
        message: 'This is a feedback message',
        message_type: 'suggestion',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      };

      const result = await emailService.sendMessageNotification(message);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Nuevo mensaje de feedback recibido',
          html: expect.stringContaining('Mensaje:</strong> This is a feedback message'),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle message without content', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const message = {
        message_type: 'bug_report',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      };

      const result = await emailService.sendMessageNotification(message);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Mensaje:</strong> Sin contenido'),
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
