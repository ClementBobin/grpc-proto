import { InfraService } from '@/BL/infra.service';
import { HealthStatusSchema } from '@/DTO/infra.dto';
import type { grpc } from '@/lib/grpc';
import type { HealthCheckRequest, HealthCheckResponse } from '@/DTO/infra.dto';

export const infraServiceImplementation = {
  healthCheck: async (
    call: grpc.ServerUnaryCall<HealthCheckRequest, HealthCheckResponse>,
    callback: grpc.sendUnaryData<HealthCheckResponse>
  ) => {
    try {
      const healthStatus = await InfraService.healthCheck();
      
      // Validate with Zod
      const validatedStatus = HealthStatusSchema.parse(healthStatus);
      
      const response: HealthCheckResponse = {
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
