import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { createTLSCredentials } from './modules/tls.module';
import { loadServerConfig } from './config';
import { disconnectDb } from '@/DAL/prismaClient';
import logger from './modules/logs.module';

export interface GrpcServiceDefinition {
  protoPath: string;
  packageName: string;
  serviceName: string;
  implementation: grpc.UntypedServiceImplementation;
  applyAuth?: boolean; // Optional flag to apply auth middleware (default: true)
}

/**
 * Load a proto file and return the package definition
 */
export function loadProtoFile(protoPath: string): grpc.GrpcObject {
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(packageDefinition);
}

/**
 * Helper to create and start a gRPC server
 */
export class GrpcServer {
  private server: grpc.Server;
  private services: GrpcServiceDefinition[] = [];
  private config = loadServerConfig();

  constructor() {
    this.server = new grpc.Server();
  }

  /**
   * Add a gRPC service to the server
   * Automatically applies API key authentication middleware based on database configuration
   */
  async addService(serviceDefinition: GrpcServiceDefinition): Promise<void> {
    const protoPath = path.resolve(__dirname, '../../protos', serviceDefinition.protoPath);
    const proto = loadProtoFile(protoPath);

    const packageObj = proto[serviceDefinition.packageName] as any;
    const serviceObj = packageObj[serviceDefinition.serviceName];

    if (!serviceObj || !serviceObj.service) {
      throw new Error(
        `Service ${serviceDefinition.serviceName} not found in package ${serviceDefinition.packageName}`
      );
    }

    // Apply auth middleware automatically if not explicitly disabled
    let implementation = serviceDefinition.implementation;
    const applyAuth = serviceDefinition.applyAuth !== false; // Default to true
    
    if (applyAuth) {
      const { applyServiceAuthMiddleware } = await import('./middleware/serviceAuth.middleware');
      try {
        implementation = await applyServiceAuthMiddleware(
          serviceDefinition.implementation,
          serviceDefinition.serviceName
        );
        logger.info(`✓ Applied auth middleware to: ${serviceDefinition.serviceName}`);
      } catch (error) {
        logger.warn(`⚠️  No auth configuration found for ${serviceDefinition.serviceName}, using original implementation`);
      }
    }

    this.server.addService(serviceObj.service, implementation);
    this.services.push(serviceDefinition);
    logger.info(`✓ Added service: ${serviceDefinition.packageName}.${serviceDefinition.serviceName}`);
  }

  /**
   * Start the gRPC server
   */
  async start(port?: string, useTLS?: boolean): Promise<void> {
    const serverPort = port || this.config.port;
    const enableTLS = useTLS !== undefined ? useTLS : this.config.useTLS;

    return new Promise((resolve, reject) => {
      let serverCreds: grpc.ServerCredentials;

      if (enableTLS) {
        try {
          serverCreds = createTLSCredentials(
            this.config.certPath!,
            this.config.keyPath!,
            this.config.caPath
          );
          logger.info('🔒 TLS enabled');
        } catch (error) {
          logger.warn('⚠️  Failed to load TLS credentials, falling back to insecure mode');
          logger.warn(`   Error: ${error instanceof Error ? error.message : error}`);
          serverCreds = grpc.ServerCredentials.createInsecure();
        }
      } else {
        serverCreds = grpc.ServerCredentials.createInsecure();
        logger.info('🔓 Running in insecure mode (no TLS)');
      }

      this.server.bindAsync(serverPort, serverCreds, (error, actualPort) => {
        if (error) return reject(error);

        logger.info(`\n🚀 gRPC Server started on ${actualPort}`);
        logger.info(`   Protocol: ${enableTLS ? 'gRPC with TLS' : 'gRPC insecure'}`);
        logger.info(`   Auth: API Key (automatically applied from DB configuration)`);
        logger.info('\n📋 Registered services:');
        this.services.forEach(service => {
          logger.info(`  - ${service.packageName}.${service.serviceName}`);
        });
        resolve();
      });
    });
  }

  /**
   * Stop the gRPC server gracefully
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        logger.info('gRPC Server stopped');
        resolve();
      });
    });
  }

  /**
   * Force shutdown the gRPC server
   */
  forceShutdown(): void {
    this.server.forceShutdown();
    logger.info('gRPC Server force shutdown');
  }
}

// Handle graceful shutdown globally, outside the class
function setupGracefulShutdown(server: GrpcServer): void {
  const shutdown = async (signal: string) => {
    logger.info(`\nReceived ${signal}, shutting down gracefully...`);
    await disconnectDb();
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export { grpc, setupGracefulShutdown };
