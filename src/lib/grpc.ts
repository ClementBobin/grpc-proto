import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

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

  constructor() {
    this.server = new grpc.Server();
  }

  /**
   * Add a gRPC service to the server
   */
  addService(serviceDefinition: GrpcServiceDefinition): void {
    const protoPath = path.resolve(__dirname, '../../proto', serviceDefinition.protoPath);
    const proto = loadProtoFile(protoPath);
    
    // Navigate to the service definition
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
  async start(port: string = '0.0.0.0:50051'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        port,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            reject(error);
            return;
          }
          
          this.server.start();
          console.log(`\n🚀 gRPC Server started on ${port}`);
          console.log(`Registered services: ${this.services.length}`);
          this.services.forEach(service => {
            console.log(`  - ${service.packageName}.${service.serviceName}`);
          });
          resolve();
        }
      );
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

export { grpc };
