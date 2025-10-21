import { infraServiceImplementation } from '../../src/grpc/infra.server';
import { InfraService } from '../../src/BL/infra.service';
import type { grpc } from '../../src/lib/grpc';

// Mock the InfraService
jest.mock('../../src/BL/infra.service', () => ({
  InfraService: {
    healthCheck: jest.fn(),
  },
}));

describe('infraServiceImplementation', () => {
  let logger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = require('../../src/lib/modules/logger.module').default;
  });

  describe('healthCheck', () => {
    it('should return healthy status and log info messages', async () => {
      const mockHealthStatus = {
        status: 'healthy',
        timestamp: '2025-10-21T08:22:42.377Z',
        database: 'connected',
      };

      (InfraService.healthCheck as jest.Mock).mockResolvedValue(mockHealthStatus);

      const mockCall = {
        request: {},
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await infraServiceImplementation.healthCheck(mockCall, mockCallback);

      expect(InfraService.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(null, mockHealthStatus);
      
      // Verify logger was called
      expect(logger.info).toHaveBeenCalledWith('Health check request received');
      expect(logger.info).toHaveBeenCalledWith('Health check response: healthy');
    });

    it('should return unhealthy status and log info messages', async () => {
      const mockHealthStatus = {
        status: 'unhealthy',
        timestamp: '2025-10-21T08:22:42.377Z',
        database: 'disconnected',
        error: 'Database connection failed',
      };

      (InfraService.healthCheck as jest.Mock).mockResolvedValue(mockHealthStatus);

      const mockCall = {
        request: {},
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await infraServiceImplementation.healthCheck(mockCall, mockCallback);

      expect(InfraService.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(null, mockHealthStatus);
      
      // Verify logger was called
      expect(logger.info).toHaveBeenCalledWith('Health check request received');
      expect(logger.info).toHaveBeenCalledWith('Health check response: unhealthy');
    });

    it('should handle errors and log them', async () => {
      const mockError = new Error('Database connection failed');
      (InfraService.healthCheck as jest.Mock).mockRejectedValue(mockError);

      const mockCall = {
        request: {},
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await infraServiceImplementation.healthCheck(mockCall, mockCallback);

      expect(InfraService.healthCheck).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        {
          code: 13,
          message: 'Database connection failed',
        },
        null
      );
      
      // Verify logger was called with error
      expect(logger.logWithErrorHandling).toHaveBeenCalledWith('Health check failed', mockError);
    });
  });
});
