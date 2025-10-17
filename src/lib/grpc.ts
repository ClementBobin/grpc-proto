import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { createTLSCredentials } from './modules/tls.module';
import { loadServerConfig } from './config';

export interface GrpcServiceDefinition {
  protoPath: string;
  packageName: string;
  serviceName: string;
  implementation: grpc.UntypedServiceImplementation;
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
   */
  addService(serviceDefinition: GrpcServiceDefinition): void {
    const protoPath = path.resolve(__dirname, '../../protos', serviceDefinition.protoPath);
    const proto = loadProtoFile(protoPath);

    const packageObj = proto[serviceDefinition.packageName] as any;
    const serviceObj = packageObj[serviceDefinition.serviceName];

    if (!serviceObj || !serviceObj.service) {
      throw new Error(
        `Service ${serviceDefinition.serviceName} not found in package ${serviceDefinition.packageName}`
      );
    }

    this.server.addService(serviceObj.service, serviceDefinition.implementation);
    this.services.push(serviceDefinition);
    console.log(`✓ Added service: ${serviceDefinition.packageName}.${serviceDefinition.serviceName}`);
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
          console.log('🔒 TLS enabled');
        } catch (error) {
          console.warn('⚠️  Failed to load TLS credentials, falling back to insecure mode');
          console.warn('   Error:', error instanceof Error ? error.message : error);
          serverCreds = grpc.ServerCredentials.createInsecure();
        }
      } else {
        serverCreds = grpc.ServerCredentials.createInsecure();
        console.log('🔓 Running in insecure mode (no TLS)');
      }

      this.server.bindAsync(serverPort, serverCreds, (error, actualPort) => {
        if (error) return reject(error);

        console.log(`\n🚀 gRPC Server started on ${actualPort}`);
        console.log(`   Protocol: ${enableTLS ? 'gRPC with TLS' : 'gRPC insecure'}`);
        console.log(`   Auth: ${this.config.enableAuth ? 'Enabled' : 'Disabled'}`);
        if (this.config.enableAuth) {
          console.log(`   Auth Level: ${this.config.authLevel}`);
        }
        console.log('\n📋 Registered services:');
        this.services.forEach(service => {
          console.log(`  - ${service.packageName}.${service.serviceName}`);
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
        console.log('gRPC Server stopped');
        resolve();
      });
    });
  }

  /**
   * Force shutdown the gRPC server
   */
  forceShutdown(): void {
    this.server.forceShutdown();
    console.log('gRPC Server force shutdown');
  }
}

// Handle graceful shutdown globally, outside the class
function setupGracefulShutdown(server: GrpcServer): void {
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export { grpc, setupGracefulShutdown };
