import { GrpcServer, setupGracefulShutdown } from '@/lib/grpc';
import { infraServiceImplementation } from '@/grpc/infra.server';
import { userServiceImplementation } from '@/grpc/user.server';
import prisma from '@/DAL/prismaClient';

const server = new GrpcServer();

// Function to test the database connection
async function testDbConnection() {
  try {
    // Attempt to connect to the database
    await prisma.$connect();
    // Log a success message if the connection is successful
    console.log('Database connection successful');

    // Close the database connection
    await prisma.$disconnect();
  } catch (error) {
    // Log an error message if the connection fails
    console.error('Database connection failed', error);
    // Log a critical error message and close the server
    console.error('Exiting due to database connection failure');
    await server.stop();
    process.exit(1);
  }
}

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

    // Setup periodic database connection check (every hour)
    setInterval(testDbConnection, 60 * 60 * 1000);

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default server;