import { GrpcServer, setupGracefulShutdown } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';
import { authServiceImplementation } from '@/grpc/auth.server';
import { testDbConnection } from '@/DAL/prismaClient';
import logger from '@/lib/modules/logger.module';

const server = new GrpcServer();

async function main() {
  try {
    // Test database connection
    await testDbConnection();

    // Add infrastructure service (no auth required for health checks)
    await server.addService({
      protoPath: 'infra.proto',
      packageName: 'infra',
      serviceName: 'InfraService',
      implementation: infraServiceImplementation,
      applyAuth: false, // Health checks don't need authentication
    });

    // Add user service (auth middleware will be automatically applied from DB config)
    await server.addService({
      protoPath: 'user.proto',
      packageName: 'user',
      serviceName: 'UserService',
      implementation: userServiceImplementation,
    });

    // Add auth service (auth middleware will be automatically applied from DB config)
    await server.addService({
      protoPath: 'auth.proto',
      packageName: 'auth',
      serviceName: 'AuthService',
      implementation: authServiceImplementation,
    });

    // Start the server
    await server.start();

    // Periodic Prisma health monitor (every 5 minutes)
    setInterval(async () => {
      try {
        await testDbConnection(1);
      } catch {
        logger.error('💥 Prisma health check failed — reconnection will be handled automatically');
      }
    }, 5 * 60 * 1000);

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.logWithErrorHandling('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default server;