import * as grpc from '@grpc/grpc-js';
import { 
  createApiKey, 
  revokeApiKey, 
  requireServiceAuthWithPermission,
  applyServiceAuthMiddleware 
} from '@/lib/middleware/serviceAuth.middleware';
import { prismaMock } from '../../__mocks__/singleton';

describe('Service Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create an API key for a service', async () => {
      const mockService = {
        id: 'service-1',
        name: 'api-rest-service',
        roleId: 'role-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockApiKey = {
        id: 'key-1',
        key: 'test-api-key-123',
        serviceId: 'service-1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
      };

      prismaMock.service.findUnique.mockResolvedValue(mockService);
      prismaMock.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await createApiKey('api-rest-service', 30);

      expect(result.key).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(prismaMock.service.findUnique).toHaveBeenCalledWith({
        where: { name: 'api-rest-service' },
      });
      expect(prismaMock.apiKey.create).toHaveBeenCalled();
    });

    it('should throw error when service not found', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(createApiKey('nonexistent-service', 30)).rejects.toThrow(
        'Service not found: nonexistent-service'
      );
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const mockApiKey = {
        id: 'key-1',
        key: 'test-api-key-123',
        serviceId: 'service-1',
        expiresAt: new Date(),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: true,
      };

      prismaMock.apiKey.update.mockResolvedValue(mockApiKey);

      await revokeApiKey('test-api-key-123');

      expect(prismaMock.apiKey.update).toHaveBeenCalledWith({
        where: { key: 'test-api-key-123' },
        data: { isRevoked: true },
      });
    });
  });

  describe('requireServiceAuthWithPermission', () => {
    const mockHandler = jest.fn(async (call, callback) => {
      callback(null, { success: true });
    });

    it('should allow request with valid API key and permission', async () => {
      const mockService = {
        id: 'service-1',
        name: 'api-rest-service',
        roleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        serviceRoles: [
          {
            serviceId: 'service-1',
            roleId: 'role-1',
            role: {
              id: 'role-1',
              name: 'service-admin',
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-1',
                  permissionId: 'perm-1',
                  permission: {
                    id: 'perm-1',
                    name: 'user:get',
                    description: 'Get user permission',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
      };

      const mockApiKey = {
        id: 'key-1',
        key: 'valid-api-key',
        serviceId: 'service-1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
        service: {
          id: 'service-1',
          name: 'api-rest-service',
          roleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey);
      prismaMock.apiKey.update.mockResolvedValue({ ...mockApiKey, lastUsedAt: new Date() });
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);

      const metadata = new grpc.Metadata();
      metadata.add('service-authorization', 'Bearer valid-api-key');

      const mockCall = {
        request: { id: 'user-1' },
        metadata,
      } as any;

      const mockCallback = jest.fn();
      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:get');

      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockCall.serviceName).toBe('api-rest-service');
    });

    it('should reject request without authorization header', async () => {
      const metadata = new grpc.Metadata();

      const mockCall = {
        request: { id: 'user-1' },
        metadata,
      } as any;

      const mockCallback = jest.fn();
      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:get');

      await wrappedHandler(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Missing API key',
        }),
        null
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      prismaMock.apiKey.findUnique.mockResolvedValue(null);

      const metadata = new grpc.Metadata();
      metadata.add('service-authorization', 'Bearer invalid-key');

      const mockCall = {
        request: { id: 'user-1' },
        metadata,
      } as any;

      const mockCallback = jest.fn();
      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:get');

      await wrappedHandler(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Invalid API key',
        }),
        null
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject request with revoked API key', async () => {
      const mockApiKey = {
        id: 'key-1',
        key: 'revoked-key',
        serviceId: 'service-1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: true,
        service: {
          id: 'service-1',
          name: 'api-rest-service',
          roleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey);

      const metadata = new grpc.Metadata();
      metadata.add('service-authorization', 'Bearer revoked-key');

      const mockCall = {
        request: { id: 'user-1' },
        metadata,
      } as any;

      const mockCallback = jest.fn();
      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:get');

      await wrappedHandler(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'API key has been revoked',
        }),
        null
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject request with expired API key', async () => {
      const mockApiKey = {
        id: 'key-1',
        key: 'expired-key',
        serviceId: 'service-1',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
        service: {
          id: 'service-1',
          name: 'api-rest-service',
          roleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey);

      const metadata = new grpc.Metadata();
      metadata.add('service-authorization', 'Bearer expired-key');

      const mockCall = {
        request: { id: 'user-1' },
        metadata,
      } as any;

      const mockCallback = jest.fn();
      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:get');

      await wrappedHandler(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'API key has expired',
        }),
        null
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject request when service lacks required permission', async () => {
      const mockService = {
        id: 'service-1',
        name: 'api-rest-service',
        roleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        serviceRoles: [
          {
            serviceId: 'service-1',
            roleId: 'role-1',
            role: {
              id: 'role-1',
              name: 'service-admin',
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [],
            },
          },
        ],
      };

      const mockApiKey = {
        id: 'key-1',
        key: 'valid-api-key',
        serviceId: 'service-1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
        service: {
          id: 'service-1',
          name: 'api-rest-service',
          roleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey);
      prismaMock.apiKey.update.mockResolvedValue({ ...mockApiKey, lastUsedAt: new Date() });
      prismaMock.service.findUnique.mockResolvedValue(mockService as any);

      const metadata = new grpc.Metadata();
      metadata.add('service-authorization', 'Bearer valid-api-key');

      const mockCall = {
        request: { id: 'user-1' },
        metadata,
      } as any;

      const mockCallback = jest.fn();
      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:delete');

      await wrappedHandler(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.PERMISSION_DENIED,
          message: 'Service does not have permission: user:delete',
        }),
        null
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('applyServiceAuthMiddleware', () => {
    it('should wrap service implementation with auth middleware', async () => {
      const mockServiceImplementation = {
        getUser: jest.fn(),
        createUser: jest.fn(),
      };

      const mockEndpoints = [
        {
          id: 'endpoint-1',
          serviceName: 'UserService',
          endpointName: 'getUser',
          permissionId: 'perm-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          permission: {
            id: 'perm-1',
            name: 'user:get',
            description: 'Get user permission',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'endpoint-2',
          serviceName: 'UserService',
          endpointName: 'createUser',
          permissionId: 'perm-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          permission: {
            id: 'perm-2',
            name: 'user:create',
            description: 'Create user permission',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      prismaMock.serviceEndpoint.findMany.mockResolvedValue(mockEndpoints as any);

      const wrappedService = await applyServiceAuthMiddleware(
        mockServiceImplementation,
        'UserService'
      );

      expect(wrappedService).toBeDefined();
      expect(wrappedService.getUser).toBeDefined();
      expect(wrappedService.createUser).toBeDefined();
      expect(prismaMock.serviceEndpoint.findMany).toHaveBeenCalledWith({
        where: { serviceName: 'UserService' },
        include: { permission: true },
      });
    });

    it('should return original implementation if no endpoints configured', async () => {
      const mockServiceImplementation = {
        healthCheck: jest.fn(),
      };

      prismaMock.serviceEndpoint.findMany.mockResolvedValue([]);

      const wrappedService = await applyServiceAuthMiddleware(
        mockServiceImplementation,
        'InfraService'
      );

      expect(wrappedService).toBeDefined();
      expect(wrappedService.healthCheck).toBe(mockServiceImplementation.healthCheck);
    });
  });
});
