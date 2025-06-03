const NewsletterService = require('../../src/services/newsletter.service.js');
const { supabase } = require('../../src/db/supabase');
const emailService = require('../../src/services/email.service');

// Mock dependencies
jest.mock('../../src/db/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../src/services/email.service', () => ({
  sendEmail: jest.fn()
}));

describe('NewsletterService', () => {
  let newsletterService;
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
    };

    supabase.from.mockReturnValue(mockQueryBuilder);
    newsletterService = require('../../src/services/newsletter.service.js');
  });

  describe('subscribeToNewsletter', () => {
    const testEmail = 'test@example.com';

    it('should subscribe new email successfully', async () => {
      const mockData = [{
        id: 'sub-123',
        email: testEmail,
        subscribed_at: '2023-01-01T00:00:00Z',
        is_active: true
      }];

      // Mock no existing subscription
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock successful insert
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      emailService.sendEmail.mockResolvedValue({ success: true });

      const result = await newsletterService.subscribeToNewsletter(testEmail);

      expect(supabase.from).toHaveBeenCalledWith('newsletter_subscribers');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        email: testEmail,
        subscribed_at: expect.any(String),
        is_active: true
      });
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should return error if email already subscribed', async () => {
      // Mock existing subscription
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { email: testEmail },
        error: null
      });

      const result = await newsletterService.subscribeToNewsletter(testEmail);

      expect(result).toEqual({
        success: false,
        message: 'Este correo ya está suscrito al newsletter'
      });
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    it('should handle database errors during subscription', async () => {
      // Mock no existing subscription
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock insert error
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(newsletterService.subscribeToNewsletter(testEmail))
        .rejects.toThrow('Error al suscribir al newsletter: Database error');
    });

    it('should continue if email confirmation fails', async () => {
      const mockData = [{ id: 'sub-123', email: testEmail }];

      // Mock no existing subscription
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock successful insert
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      // Mock email service failure
      emailService.sendEmail.mockRejectedValue(new Error('Email failed'));

      // Should not throw error even if email fails
      const result = await newsletterService.subscribeToNewsletter(testEmail);

      expect(result).toEqual({ success: true, data: mockData });
    });
  });

  describe('getAllSubscribers', () => {
    it('should get all subscribers with default pagination', async () => {
      const mockSubscribers = [
        { id: 'sub-1', email: 'user1@example.com', is_active: true },
        { id: 'sub-2', email: 'user2@example.com', is_active: true }
      ];

      mockQueryBuilder.range.mockResolvedValueOnce({
        data: mockSubscribers,
        error: null
      });

      const result = await newsletterService.getAllSubscribers();

      expect(supabase.from).toHaveBeenCalledWith('newsletter_subscribers');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('subscribed_at', { ascending: false });
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 49);
      expect(result).toEqual(mockSubscribers);
    });

    it('should handle custom pagination parameters', async () => {
      mockQueryBuilder.range.mockResolvedValueOnce({
        data: [],
        error: null
      });

      await newsletterService.getAllSubscribers({ limit: 20, offset: 10 });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 29);
    });

    it('should handle query errors', async () => {
      mockQueryBuilder.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Query failed' }
      });

      await expect(newsletterService.getAllSubscribers())
        .rejects.toThrow('Error al obtener suscriptores: Query failed');
    });
  });

  describe('unsubscribe', () => {
    const testEmail = 'test@example.com';

    it('should unsubscribe email successfully', async () => {
      const mockData = [{
        id: 'sub-123',
        email: testEmail,
        is_active: false,
        unsubscribed_at: '2023-01-01T00:00:00Z'
      }];

      mockQueryBuilder.select.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const result = await newsletterService.unsubscribe(testEmail);

      expect(supabase.from).toHaveBeenCalledWith('newsletter_subscribers');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        is_active: false,
        unsubscribed_at: expect.any(String)
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('email', testEmail);
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should return error if email not found', async () => {
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await newsletterService.unsubscribe(testEmail);

      expect(result).toEqual({
        success: false,
        message: 'Este correo no está suscrito al newsletter'
      });
    });

    it('should handle database errors during unsubscribe', async () => {
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(newsletterService.unsubscribe(testEmail))
        .rejects.toThrow('Error al dar de baja del newsletter: Database error');
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should call email service with correct parameters', async () => {
      emailService.sendEmail.mockResolvedValue({ success: true });

      await newsletterService.sendConfirmationEmail('test@example.com');

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '✈️ ¡Bienvenido a Nómada! Confirmación de suscripción',
        html: expect.stringContaining('¡Gracias por unirte a nosotros!')
      });
    });
  });
});
