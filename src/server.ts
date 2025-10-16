import 'module-alias/register';
import { GrpcServer } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';

async function main() {
  try {
    console.log('Starting gRPC Server...');

    const server = new GrpcServer();

    // Add infrastructure service
    server.addService({
      protoPath: 'infra.proto',
      packageName: 'infra',
      serviceName: 'InfraService',
      implementation: infraServiceImplementation,
    });

    // Add user service
    server.addService({
      protoPath: 'user.proto',
      packageName: 'user',
      serviceName: 'UserService',
      implementation: userServiceImplementation,
    });

    // Start the server
    const port = process.env.GRPC_PORT || '0.0.0.0:50051';
    await server.start(port);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
