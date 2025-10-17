import { GrpcServer, setupGracefulShutdown } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';
import { applyAuthMiddleware } from '@/lib/middleware/auth.middleware';
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

    // Add user service with auth middleware
    // Example: Apply endpoint-level auth
    const userServiceWithAuth = applyAuthMiddleware(userServiceImplementation, {
      level: config.authLevel,
      // Global auth example: require 'admin' role for all endpoints
      globalRoles: ['admin', 'user'],
      // Service-level auth example
      serviceConfig: {
        enabled: true,
        allowedRoles: ['admin', 'user'],
      },
      // Endpoint-level auth example: configure per-method
      endpointConfig: {
        createUser: { enabled: true, allowedRoles: ['admin'] },
        updateUser: { enabled: true, allowedRoles: ['admin', 'user'] },
        deleteUser: { enabled: true, allowedRoles: ['admin'] },
        getUser: { enabled: true, allowedRoles: ['admin', 'user'] },
        listUsers: { enabled: true, allowedRoles: ['admin', 'user'] },
      },
    });

    server.addService({
      protoPath: 'user.proto',
      packageName: 'user',
      serviceName: 'UserService',
      implementation: userServiceWithAuth,
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