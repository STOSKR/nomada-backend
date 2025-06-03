const moodService = require('../../src/services/mood.service.js');
const { supabase } = require('../../src/db/supabase');
const emailService = require('../../src/services/email.service');

// Mock dependencies
jest.mock('../../src/db/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../src/services/email.service', () => ({
  sendMoodNotification: jest.fn()
}));

describe('MoodService', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis()
    };

    supabase.from.mockReturnValue(mockQueryBuilder);
  });

  describe('saveMood', () => {
    const validMoodData = {
      moodType: 'happy',
      userId: 'user-123',
      timestamp: '2023-01-01T00:00:00Z'
    };

    it('should save mood successfully', async () => {
      const mockData = [{ 
        id: 'mood-123', 
        mood_type: 'happy',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      }];

      mockQueryBuilder.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await moodService.saveMood(validMoodData);

      expect(supabase.from).toHaveBeenCalledWith('moods');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        mood_type: 'happy',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      });
      expect(emailService.sendMoodNotification).toHaveBeenCalledWith(mockData[0]);
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should use current timestamp when not provided', async () => {
      const moodDataWithoutTimestamp = {
        moodType: 'excited',
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'mood-123' }],
        error: null
      });

      await moodService.saveMood(moodDataWithoutTimestamp);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          mood_type: 'excited',
          user_id: 'user-123',
          created_at: expect.any(String)
        })
      );
    });

    it('should handle different mood types', async () => {
      const moodTypes = ['happy', 'sad', 'excited', 'calm', 'anxious'];

      for (const moodType of moodTypes) {
        mockQueryBuilder.select.mockResolvedValue({
          data: [{ id: `mood-${moodType}` }],
          error: null
        });

        const moodData = {
          moodType: moodType,
          userId: 'user-123'
        };

        const result = await moodService.saveMood(moodData);

        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            mood_type: moodType,
            user_id: 'user-123'
          })
        );
        expect(result.success).toBe(true);
      }
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(moodService.saveMood(validMoodData))
        .rejects.toThrow('Error al guardar estado de ánimo: Database error');
    });

    it('should continue if email notification fails', async () => {
      const mockData = [{ id: 'mood-123' }];
      
      mockQueryBuilder.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      emailService.sendMoodNotification.mockRejectedValue(new Error('Email failed'));

      // Should not throw error even if email fails
      const result = await moodService.saveMood(validMoodData);

      expect(result).toEqual({ success: true, data: mockData });
      expect(emailService.sendMoodNotification).toHaveBeenCalled();
    });

    it('should handle empty data response', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await moodService.saveMood(validMoodData);

      expect(result).toEqual({ success: true, data: [] });
      expect(emailService.sendMoodNotification).not.toHaveBeenCalled();
    });

    it('should throw error for invalid mood data structure', async () => {
      mockQueryBuilder.select.mockImplementation(() => {
        throw new Error('Invalid data structure');
      });

      await expect(moodService.saveMood(validMoodData))
        .rejects.toThrow('Error al guardar estado de ánimo: Invalid data structure');
    });
  });
});
