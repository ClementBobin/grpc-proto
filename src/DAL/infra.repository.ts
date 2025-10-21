import { testDbConnection } from '@/DAL/prismaClient';
import logger from '@/lib/modules/logger.module';

export const InfraRepository = {
  /**
   * Checks overall system health — particularly database connectivity.
   */
  getHealthStatus: async () => {
    logger.debug('[InfraRepository.getHealthStatus] Starting health check');
    const timestamp = new Date().toISOString();

    try {
      await testDbConnection(3, 1500);
      logger.info('[InfraRepository.getHealthStatus] Database connection successful');

      return {
        status: 'healthy',
        timestamp,
        database: 'connected',
      };
    } catch (error) {
      logger.error('[InfraRepository.getHealthStatus] Database connection failed');
      logger.logWithErrorHandling('[InfraRepository.getHealthStatus] Health check error', error);
      return {
        status: 'unhealthy',
        timestamp,
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};