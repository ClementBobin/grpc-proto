import { InfraService } from '@/BL/infra.service';
import { HealthStatusSchema, type HealthStatus } from '@/DTO/infra.dto';
import type { grpc } from '@/lib/grpc';

export const infraServiceImplementation = {
  healthCheck: async (
    call: grpc.ServerUnaryCall<HealthStatus, HealthStatus>,
    callback: grpc.sendUnaryData<HealthStatus>
  ) => {
    try {
      const healthStatus = await InfraService.healthCheck();
      
      // Validate with Zod
      const validatedStatus = HealthStatusSchema.parse(healthStatus);
      
      const response: HealthStatus = {
        status: validatedStatus.status,
        timestamp: validatedStatus.timestamp,
        database: validatedStatus.database,
        error: validatedStatus.error,
      };

      callback(null, response);
    } catch (error) {
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
