const messageService = require('../../src/services/message.service.js');
const { supabase } = require('../../src/db/supabase');
const emailService = require('../../src/services/email.service');

// Mock dependencies
jest.mock('../../src/db/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../src/services/email.service', () => ({
  sendMessageNotification: jest.fn()
}));

describe('MessageService', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis()
    };

    supabase.from.mockReturnValue(mockQueryBuilder);
  });

  describe('saveMessage', () => {
    const validMessageData = {
      message: 'Test feedback message',
      messageType: 'suggestion',
      userId: 'user-123',
      timestamp: '2023-01-01T00:00:00Z'
    };

    it('should save message successfully', async () => {
      const mockData = [{ 
        id: 'message-123', 
        message: 'Test feedback message',
        message_type: 'suggestion',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      }];

      mockQueryBuilder.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await messageService.saveMessage(validMessageData);

      expect(supabase.from).toHaveBeenCalledWith('feedback_messages');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        message: 'Test feedback message',
        message_type: 'suggestion',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      });
      expect(emailService.sendMessageNotification).toHaveBeenCalledWith(mockData[0]);
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should use current timestamp when not provided', async () => {
      const messageDataWithoutTimestamp = {
        message: 'Test message',
        messageType: 'bug',
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'message-123' }],
        error: null
      });

      await messageService.saveMessage(messageDataWithoutTimestamp);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
          message_type: 'bug',
          user_id: 'user-123',
          created_at: expect.any(String)
        })
      );
    });

    it('should return success with null data when no message content', async () => {
      const emptyMessageData = {
        userId: 'user-123'
      };

      const result = await messageService.saveMessage(emptyMessageData);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: null });
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(messageService.saveMessage(validMessageData))
        .rejects.toThrow('Error al guardar mensaje de feedback: Database error');
    });

    it('should continue if email notification fails', async () => {
      const mockData = [{ id: 'message-123' }];
      
      mockQueryBuilder.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      emailService.sendMessageNotification.mockRejectedValue(new Error('Email failed'));

      // Should not throw error even if email fails
      const result = await messageService.saveMessage(validMessageData);

      expect(result).toEqual({ success: true, data: mockData });
      expect(emailService.sendMessageNotification).toHaveBeenCalled();
    });

    it('should handle null message but valid messageType', async () => {
      const messageData = {
        messageType: 'feature_request',
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'message-123' }],
        error: null
      });

      const result = await messageService.saveMessage(messageData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: null,
          message_type: 'feature_request',
          user_id: 'user-123'
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle message with null messageType', async () => {
      const messageData = {
        message: 'Just a message',
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'message-123' }],
        error: null
      });

      const result = await messageService.saveMessage(messageData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Just a message',
          message_type: null,
          user_id: 'user-123'
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
