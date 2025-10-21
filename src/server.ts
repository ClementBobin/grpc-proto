import { GrpcServer, setupGracefulShutdown } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';

const server = new GrpcServer();

async function main() {
  try {
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

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default server;