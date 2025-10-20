import { GrpcServer, setupGracefulShutdown } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';
import { applyServiceAuthMiddleware } from '@/lib/middleware/serviceAuth.middleware';
import { loadServerConfig } from '@/lib/config';

const server = new GrpcServer();
const config = loadServerConfig();

async function main() {
  try {
    console.log('Starting gRPC Server...');
    console.log(`Configuration:`);
    console.log(`  - Port: ${config.port}`);
    console.log(`  - TLS: ${config.useTLS ? 'Enabled' : 'Disabled'}`);
    console.log(`  - Auth: ${config.enableAuth ? 'Enabled' : 'Disabled'}`);
    if (config.enableAuth) {
      console.log(`  - Auth Level: ${config.authLevel}`);
    }

    // Add infrastructure service (no auth required for health checks)
    server.addService({
      protoPath: 'infra.proto',
      packageName: 'infra',
      serviceName: 'InfraService',
      implementation: infraServiceImplementation,
    });

    // Add user service with SERVICE auth middleware (permission-based)
    // Permissions are now automatically fetched from database based on serviceName
    const userServiceWithServiceAuth = await applyServiceAuthMiddleware(userServiceImplementation, {
      level: 'endpoint',
      serviceName: 'UserService',
    });

    server.addService({
      protoPath: 'user.proto',
      packageName: 'user',
      serviceName: 'UserService',
      implementation: userServiceWithServiceAuth,
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