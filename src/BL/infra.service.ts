import { InfraRepository } from '@/DAL/infra.repository';
import logger from '@/lib/modules/logger.module';

export const InfraService = {
  healthCheck: async () => {
    logger.debug('[InfraService.healthCheck] Performing health check');
    try {
      const healthStatus = await InfraRepository.getHealthStatus();
      logger.trackOperationTime(
        Promise.resolve(healthStatus),
        'InfraService.healthCheck'
      );
      logger.info(`[InfraService.healthCheck] Health check completed - status: ${healthStatus.status}`);
      return healthStatus;
    } catch (error) {
      logger.logWithErrorHandling('[InfraService.healthCheck] Error performing health check', error);
      throw error;
    }
  }
};