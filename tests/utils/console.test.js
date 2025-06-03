const console_util = require('../../src/utils/console');

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  console.log = mockConsoleLog;
  console.error = mockConsoleError;
});

afterEach(() => {
  console.log = console.log;
  console.error = console.error;
});

describe('Console Utility', () => {
  describe('colors', () => {
    it('should export all color constants', () => {
      expect(console_util.colors).toBeDefined();
      expect(console_util.colors.red).toBe('\x1b[31m');
      expect(console_util.colors.green).toBe('\x1b[32m');
      expect(console_util.colors.blue).toBe('\x1b[34m');
      expect(console_util.colors.reset).toBe('\x1b[0m');
      expect(console_util.colors.bold).toBe('\x1b[1m');
    });
  });

  describe('icons', () => {
    it('should export all icon constants', () => {
      expect(console_util.icons).toBeDefined();
      expect(console_util.icons.success).toBe('✓');
      expect(console_util.icons.error).toBe('✗');
      expect(console_util.icons.warning).toBe('⚠');
      expect(console_util.icons.info).toBe('ℹ');
      expect(console_util.icons.server).toBe('⚡');
    });
  });

  describe('box', () => {
    it('should create a box with default parameters', () => {
      console_util.box('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      expect(calls.some(call => call[0].includes('┌'))).toBe(true);
      expect(calls.some(call => call[0].includes('└'))).toBe(true);
      expect(calls.some(call => call[0].includes('Test message'))).toBe(true);
    });

    it('should create a box with custom color', () => {
      console_util.box('Test message', console_util.colors.red);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      expect(calls.some(call => call[0].includes('\x1b[31m'))).toBe(true);
    });

    it('should handle multiline text', () => {
      console_util.box('Line 1\nLine 2\nLine 3');
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      expect(calls.some(call => call[0].includes('Line 1'))).toBe(true);
      expect(calls.some(call => call[0].includes('Line 2'))).toBe(true);
      expect(calls.some(call => call[0].includes('Line 3'))).toBe(true);
    });
  });

  describe('success', () => {
    it('should display success message with icon', () => {
      console_util.success('Operation completed');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✓')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Operation completed')
      );
    });
  });

  describe('error', () => {
    it('should display error message without error object', () => {
      console_util.error('Something went wrong');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('✗')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong')
      );
    });

    it('should display error message with error object', () => {
      const testError = new Error('Test error details');
      console_util.error('Something went wrong', testError);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('✗')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong')
      );
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should show stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const testError = new Error('Test error details');
      testError.stack = 'Error stack trace';
      
      console_util.error('Something went wrong', testError);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace')
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('warning', () => {
    it('should display warning message with icon', () => {
      console_util.warning('This is a warning');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('This is a warning')
      );
    });
  });

  describe('info', () => {
    it('should display info message with icon', () => {
      console_util.info('This is information');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ℹ')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('This is information')
      );
    });
  });

  describe('serverStarted', () => {
    it('should display server information', () => {
      console_util.serverStarted({ host: 'localhost', port: 3000 });
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      const allOutput = calls.map(call => call[0]).join(' ');
      
      expect(allOutput).toContain('NOMADA BACKEND');
      expect(allOutput).toContain('localhost:3000');
      expect(allOutput).toContain('Documentación');
      expect(allOutput).toContain('Servidor listo');
    });

    it('should handle different host and port combinations', () => {
      console_util.serverStarted({ host: '0.0.0.0', port: 8080 });
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      const allOutput = calls.map(call => call[0]).join(' ');
      
      expect(allOutput).toContain('0.0.0.0:8080');
    });
  });
});
