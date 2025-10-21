import * as grpc from '@grpc/grpc-js';
import { GrpcServer, GrpcServiceDefinition, loadProtoFile } from '@/lib/grpc';
import logger from '@/lib/modules/logs.module';
import * as tls from '@/lib/modules/tls.module';

// Mock the dependencies
jest.mock('@/lib/modules/logs.module');
jest.mock('@/lib/modules/tls.module');
jest.mock('@/lib/config', () => ({
  loadServerConfig: jest.fn(() => ({
    port: '0.0.0.0:50051',
    useTLS: false,
    certPath: undefined,
    keyPath: undefined,
    caPath: undefined,
  })),
}));
jest.mock('@/DAL/prismaClient', () => ({
  disconnectDb: jest.fn(),
}));

// Mock proto loader
jest.mock('@grpc/proto-loader', () => ({
  loadSync: jest.fn(() => ({})),
}));

describe('GrpcServer with logs.module', () => {
  let server: GrpcServer;

  beforeEach(() => {
    jest.clearAllMocks();
    server = new GrpcServer();
  });

  afterEach(async () => {
    // Clean up server after each test
    try {
      server.forceShutdown();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('Logging functionality', () => {
    it('should log when adding a service without auth', async () => {
      const mockServiceDef: GrpcServiceDefinition = {
        protoPath: 'health.proto',
        packageName: 'health',
        serviceName: 'HealthService',
        implementation: {
          Check: jest.fn(),
        },
        applyAuth: false, // Disable auth for testing
      };

      // Mock loadProtoFile to return a proper proto structure
      const mockProto = {
        health: {
          HealthService: {
            service: {
              Check: { path: '/health.HealthService/Check' },
            },
          },
        },
      };

      // Mock the grpc module's loadProtoFile
      jest.spyOn(grpc, 'loadPackageDefinition').mockReturnValue(mockProto as any);

      await server.addService(mockServiceDef);

      expect(logger.info).toHaveBeenCalledWith('✓ Added service: health.HealthService');
    });

    it('should log warning when auth middleware fails to apply', async () => {
      const mockServiceDef: GrpcServiceDefinition = {
        protoPath: 'user.proto',
        packageName: 'user',
        serviceName: 'UserService',
        implementation: {
          GetUser: jest.fn(),
        },
        applyAuth: true, // Enable auth
      };

      // Mock loadProtoFile to return a proper proto structure
      const mockProto = {
        user: {
          UserService: {
            service: {
              GetUser: { path: '/user.UserService/GetUser' },
            },
          },
        },
      };

      jest.spyOn(grpc, 'loadPackageDefinition').mockReturnValue(mockProto as any);

      // Mock the auth middleware to throw an error
      jest.doMock('@/lib/middleware/serviceAuth.middleware', () => ({
        applyServiceAuthMiddleware: jest.fn().mockRejectedValue(new Error('No config')),
      }));

      await server.addService(mockServiceDef);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No auth configuration found for UserService')
      );
      expect(logger.info).toHaveBeenCalledWith('✓ Added service: user.UserService');
    });

    it('should log when server stops gracefully', async () => {
      await server.stop();

      expect(logger.info).toHaveBeenCalledWith('gRPC Server stopped');
    });

    it('should log when server is force shutdown', () => {
      server.forceShutdown();

      expect(logger.info).toHaveBeenCalledWith('gRPC Server force shutdown');
    });

    it('should log insecure mode when TLS is disabled', async () => {
      // Mock bindAsync to immediately call callback
      jest.spyOn(server['server'], 'bindAsync').mockImplementation((address, creds, callback) => {
        callback(null, 50051);
      });

      await server.start('0.0.0.0:50051', false);

      expect(logger.info).toHaveBeenCalledWith('🔓 Running in insecure mode (no TLS)');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('🚀 gRPC Server started on')
      );
    });

    it('should log TLS enabled when using TLS', async () => {
      // Mock TLS credentials
      const mockCreds = grpc.ServerCredentials.createInsecure();
      jest.spyOn(tls, 'createTLSCredentials').mockReturnValue(mockCreds);

      // Mock bindAsync to immediately call callback
      jest.spyOn(server['server'], 'bindAsync').mockImplementation((address, creds, callback) => {
        callback(null, 50052);
      });

      // Update config to include TLS paths
      const { loadServerConfig } = require('@/lib/config');
      loadServerConfig.mockReturnValue({
        port: '0.0.0.0:50052',
        useTLS: true,
        certPath: '/fake/cert.pem',
        keyPath: '/fake/key.pem',
        caPath: undefined,
      });

      const newServer = new GrpcServer();
      await newServer.start('0.0.0.0:50052', true);

      expect(logger.info).toHaveBeenCalledWith('🔒 TLS enabled');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('🚀 gRPC Server started on')
      );

      newServer.forceShutdown();
    });

    it('should log warning when TLS fails and falls back to insecure', async () => {
      // Mock TLS credentials to throw error
      jest.spyOn(tls, 'createTLSCredentials').mockImplementation(() => {
        throw new Error('TLS error');
      });

      // Mock bindAsync to immediately call callback
      jest.spyOn(server['server'], 'bindAsync').mockImplementation((address, creds, callback) => {
        callback(null, 50053);
      });

      // Update config to enable TLS
      const { loadServerConfig } = require('@/lib/config');
      loadServerConfig.mockReturnValue({
        port: '0.0.0.0:50053',
        useTLS: true,
        certPath: '/fake/cert.pem',
        keyPath: '/fake/key.pem',
        caPath: undefined,
      });

      const newServer = new GrpcServer();
      await newServer.start('0.0.0.0:50053', true);

      expect(logger.warn).toHaveBeenCalledWith(
        '⚠️  Failed to load TLS credentials, falling back to insecure mode'
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Error:')
      );

      newServer.forceShutdown();
    });

    it('should log registered services on start', async () => {
      // Add a mock service
      const mockServiceDef: GrpcServiceDefinition = {
        protoPath: 'test.proto',
        packageName: 'test',
        serviceName: 'TestService',
        implementation: {
          Test: jest.fn(),
        },
        applyAuth: false,
      };

      const mockProto = {
        test: {
          TestService: {
            service: {
              Test: { path: '/test.TestService/Test' },
            },
          },
        },
      };

      jest.spyOn(grpc, 'loadPackageDefinition').mockReturnValue(mockProto as any);
      await server.addService(mockServiceDef);

      // Mock bindAsync
      jest.spyOn(server['server'], 'bindAsync').mockImplementation((address, creds, callback) => {
        callback(null, 50054);
      });

      await server.start('0.0.0.0:50054', false);

      expect(logger.info).toHaveBeenCalledWith('\n📋 Registered services:');
      expect(logger.info).toHaveBeenCalledWith('  - test.TestService');
    });
  });
});
