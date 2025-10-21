import { InfraService } from '@/BL/infra.service';
import { HealthStatusSchema, type HealthStatus } from '@/DTO/infra.dto';
import type { grpc } from '@/lib/grpc';
import logger from '@/lib/modules/logger.module';

export const infraServiceImplementation = {
  healthCheck: async (
    call: grpc.ServerUnaryCall<HealthStatus, HealthStatus>,
    callback: grpc.sendUnaryData<HealthStatus>
  ) => {
    try {
      logger.info('Health check request received');
      const healthStatus = await InfraService.healthCheck();
      
      // Validate with Zod
      const validatedStatus = HealthStatusSchema.parse(healthStatus);
      
      const response: HealthStatus = {
        status: validatedStatus.status,
        timestamp: validatedStatus.timestamp,
        database: validatedStatus.database,
        error: validatedStatus.error,
      };

      logger.info(`Health check response: ${validatedStatus.status}`);
      callback(null, response);
    } catch (error) {
      logger.logWithErrorHandling('Health check failed', error);
      callback(
        {
          code: 13, // INTERNAL
          message: error instanceof Error ? error.message : 'Unknown error',
        } as any,
        null
      );
    }
  },
};
