import { GrpcServer, setupGracefulShutdown } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';
import prisma, { testDbConnection } from '@/DAL/prismaClient';

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

    // Start the server
    await server.start();

    // Periodic Prisma health monitor (every 5 minutes)
    setInterval(async () => {
      try {
        await testDbConnection(1);
      } catch {
        console.error('💥 Prisma health check failed — reconnection will be handled automatically');
      }
    }, 5 * 60 * 1000);

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default server;