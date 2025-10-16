import { InfraService } from '@/BL/infra.service';
import { HealthStatusSchema } from '@/DTO/infra.dto';

async function main() {
  try {
    console.log('Starting gRPC Proto Application...');
    
    // Perform health check
    const healthStatus = await InfraService.healthCheck();
    
    // Validate with Zod
    const validatedStatus = HealthStatusSchema.parse(healthStatus);
    
    console.log('Health Check:', JSON.stringify(validatedStatus, null, 2));
    
    if (validatedStatus.status === 'healthy') {
      console.log('✓ Application is running successfully!');
    } else {
      console.error('✗ Application health check failed:', validatedStatus.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();