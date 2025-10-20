import * as grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  requireServiceAuth,
  requireServiceAuthWithPermission,
  requireServiceAuthGlobal,
  requireServiceAuthEndpoint,
  applyServiceAuthMiddleware,
} from '@/lib/middleware/serviceAuth.middleware';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    service: {
      findUnique: jest.fn(),
    },
    serviceEndpoint: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const mockHandler = jest.fn(async (call: any, callback: any) => {
  callback(null, { success: true });
});

const mockImplementation = {
  getUser: mockHandler,
  createUser: mockHandler,
  updateUser: mockHandler,
};

describe('Service Auth Middleware', () => {
  const SERVICE_JWT_SECRET = process.env.SERVICE_JWT_SECRET || 'service-super-secret';
  let mockCall: any;
  let mockCallback: any;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCall = {
      request: {},
      metadata: {
        get: jest.fn(),
      },
    };

    mockCallback = jest.fn();
    prisma = new PrismaClient();
  });

  describe('requireServiceAuth', () => {
    it('should allow requests with valid service token and correct role', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
                { permission: { name: 'user:create' } },
              ],
            },
          },
        ],
      });

      const wrappedHandler = requireServiceAuth(mockHandler, 'service-admin');
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(null, { success: true });
      expect(mockCall.service).toBeDefined();
      expect(mockCall.service.serviceName).toBe('api-rest-service');
      expect(mockCall.service.role).toBe('service-admin');
      expect(mockCall.service.permissions).toContain('user:get');
    });

    it('should reject requests without service token', async () => {
      mockCall.metadata.get.mockReturnValue([]);

      const wrappedHandler = requireServiceAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Missing service token',
        }),
        null
      );
    });

    it('should reject requests with invalid service token', async () => {
      mockCall.metadata.get.mockReturnValue(['Bearer invalid-token']);

      const wrappedHandler = requireServiceAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Invalid service token',
        }),
        null
      );
    });

    it('should reject requests with wrong audience', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'wrong-audience', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedHandler = requireServiceAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
        }),
        null
      );
    });

    it('should reject requests when service does not have required role', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response with different role
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-user',
              rolePermissions: [],
            },
          },
        ],
      });

      const wrappedHandler = requireServiceAuth(mockHandler, 'service-admin');
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.PERMISSION_DENIED,
          message: 'Insufficient service role',
        }),
        null
      );
    });

    it('should reject requests when service is not found', async () => {
      const token = jwt.sign(
        { sub: 'unknown-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue(null);

      const wrappedHandler = requireServiceAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.PERMISSION_DENIED,
          message: 'Service not found',
        }),
        null
      );
    });

    it('should reject user JWT tokens', async () => {
      // User token instead of service token
      const userToken = jwt.sign(
        { userId: '123', role: 'admin' },
        'super-secret' // Different secret
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${userToken}`]);

      const wrappedHandler = requireServiceAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
        }),
        null
      );
    });
  });

  describe('requireServiceAuthWithPermission', () => {
    it('should allow requests when service has required permission', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
                { permission: { name: 'user:create' } },
              ],
            },
          },
        ],
      });

      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:get');
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(null, { success: true });
      expect(mockCall.service).toBeDefined();
    });

    it('should reject requests when service does not have required permission', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response without the required permission
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
              ],
            },
          },
        ],
      });

      const wrappedHandler = requireServiceAuthWithPermission(mockHandler, 'user:delete');
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.PERMISSION_DENIED,
          message: 'Service does not have permission: user:delete',
        }),
        null
      );
    });
  });

  describe('requireServiceAuthGlobal', () => {
    it('should wrap all methods in service with auth', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
              ],
            },
          },
        ],
      });

      const wrappedService = requireServiceAuthGlobal(mockImplementation, 'service-admin');
      
      await wrappedService.getUser(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('requireServiceAuthEndpoint', () => {
    it('should apply permission checks to specific endpoints', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
                { permission: { name: 'user:create' } },
              ],
            },
          },
        ],
      });

      const wrappedService = requireServiceAuthEndpoint(mockImplementation, {
        getUser: 'user:get',
        createUser: 'user:create',
      });
      
      await wrappedService.getUser(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('applyServiceAuthMiddleware', () => {
    it('should apply global auth when level is global', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [],
            },
          },
        ],
      });

      const wrappedService = await applyServiceAuthMiddleware(mockImplementation, {
        level: 'global',
        requiredRole: 'service-admin',
      });
      
      await wrappedService.getUser(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should apply endpoint-level auth with permissions', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
              ],
            },
          },
        ],
      });

      const wrappedService = await applyServiceAuthMiddleware(mockImplementation, {
        level: 'endpoint',
        endpointPermissions: {
          getUser: 'user:get',
        },
      });
      
      await wrappedService.getUser(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should fetch endpoint permissions from database when serviceName is provided', async () => {
      const token = jwt.sign(
        { sub: 'api-rest-service', aud: 'grpc_auth', role: 'service-admin' },
        SERVICE_JWT_SECRET
      );
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      // Mock database response for service auth
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'api-rest-service',
        serviceRoles: [
          {
            role: {
              name: 'service-admin',
              rolePermissions: [
                { permission: { name: 'user:get' } },
              ],
            },
          },
        ],
      });

      // Mock database response for endpoint permissions
      (prisma as any).serviceEndpoint = {
        findMany: jest.fn().mockResolvedValue([
          {
            endpointName: 'getUser',
            permission: { name: 'user:get' },
          },
        ]),
      };

      const wrappedService = await applyServiceAuthMiddleware(mockImplementation, {
        level: 'endpoint',
        serviceName: 'UserService',
      });
      
      await wrappedService.getUser(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
      expect((prisma as any).serviceEndpoint.findMany).toHaveBeenCalledWith({
        where: { serviceName: 'UserService' },
        include: { permission: true },
      });
    });
  });
});
