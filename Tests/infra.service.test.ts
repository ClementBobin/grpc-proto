import { InfraService } from '../src/BL/infra.service';
import { InfraRepository } from '../src/DAL/infra.repository';

// Mock the repository
jest.mock('../src/DAL/infra.repository', () => ({
  InfraRepository: {
    getHealthStatus: jest.fn(),
  },
}));

describe('InfraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return healthy status when repository returns healthy', async () => {
      const mockHealthStatus = {
        status: 'healthy',
        timestamp: '2025-10-16T06:34:37.817Z',
        database: 'connected',
      };

      (InfraRepository.getHealthStatus as jest.Mock).mockResolvedValue(mockHealthStatus);

      const result = await InfraService.healthCheck();

      expect(result).toEqual(mockHealthStatus);
      expect(InfraRepository.getHealthStatus).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when repository returns unhealthy', async () => {
      const mockHealthStatus = {
        status: 'unhealthy',
        timestamp: '2025-10-16T06:34:37.817Z',
        database: 'disconnected',
        error: 'Database connection failed',
      };

      (InfraRepository.getHealthStatus as jest.Mock).mockResolvedValue(mockHealthStatus);

      const result = await InfraService.healthCheck();

      expect(result).toEqual(mockHealthStatus);
      expect(result.status).toBe('unhealthy');
    });
  });
});
