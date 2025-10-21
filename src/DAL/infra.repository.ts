import { testDbConnection } from '@/DAL/prismaClient';

export const InfraRepository = {
  /**
   * Checks overall system health — particularly database connectivity.
   */
  getHealthStatus: async () => {
    const timestamp = new Date().toISOString();

    try {
      await testDbConnection(3, 1500);

      return {
        status: 'healthy',
        timestamp,
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp,
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};