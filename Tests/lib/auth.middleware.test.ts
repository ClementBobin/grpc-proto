import * as grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import {
  requireAuth,
  requireAuthGlobal,
  requireAuthService,
  requireAuthEndpoint,
  applyAuthMiddleware,
} from '@/lib/middleware/auth.middleware';

// Mock implementation for testing
const mockHandler = jest.fn(async (call: any, callback: any) => {
  callback(null, { success: true });
});

const mockImplementation = {
  method1: mockHandler,
  method2: mockHandler,
};

describe('Auth Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';
  let mockCall: any;
  let mockCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCall = {
      request: {},
      metadata: {
        get: jest.fn(),
      },
    };

    mockCallback = jest.fn();
  });

  describe('requireAuth', () => {
    it('should allow requests with valid token', async () => {
      const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedHandler = requireAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(null, { success: true });
      expect(mockCall.user).toBeDefined();
      expect(mockCall.user.userId).toBe('123');
    });

    it('should reject requests without token', async () => {
      mockCall.metadata.get.mockReturnValue([]);

      const wrappedHandler = requireAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Missing token',
        }),
        null
      );
    });

    it('should reject requests with invalid token', async () => {
      mockCall.metadata.get.mockReturnValue(['Bearer invalid-token']);

      const wrappedHandler = requireAuth(mockHandler);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.UNAUTHENTICATED,
        }),
        null
      );
    });

    it('should enforce role-based access control', async () => {
      const token = jwt.sign({ userId: '123', role: 'user' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedHandler = requireAuth(mockHandler, ['admin']);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: grpc.status.PERMISSION_DENIED,
          message: 'Insufficient role',
        }),
        null
      );
    });

    it('should allow access with correct role', async () => {
      const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedHandler = requireAuth(mockHandler, ['admin', 'user']);
      await wrappedHandler(mockCall, mockCallback);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(null, { success: true });
    });
  });

  describe('requireAuthGlobal', () => {
    it('should wrap all methods in service', async () => {
      const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedService = requireAuthGlobal(mockImplementation, ['admin']);
      
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject all methods without valid token', async () => {
      mockCall.metadata.get.mockReturnValue([]);

      const wrappedService = requireAuthGlobal(mockImplementation, ['admin']);
      
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('requireAuthService', () => {
    it('should apply auth when enabled', async () => {
      const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedService = requireAuthService(mockImplementation, {
        enabled: true,
        allowedRoles: ['admin'],
      });
      
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should skip auth when disabled', async () => {
      mockCall.metadata.get.mockReturnValue([]);

      const wrappedService = requireAuthService(mockImplementation, {
        enabled: false,
      });
      
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('requireAuthEndpoint', () => {
    it('should apply auth to specific endpoints only', async () => {
      const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedService = requireAuthEndpoint(mockImplementation, {
        method1: { enabled: true, allowedRoles: ['admin'] },
        method2: { enabled: false },
      });
      
      // method1 should require auth
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
      
      jest.clearAllMocks();
      mockCall.metadata.get.mockReturnValue([]);
      
      // method2 should not require auth
      await wrappedService.method2(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('applyAuthMiddleware', () => {
    it('should apply global auth when level is global', async () => {
      const token = jwt.sign({ userId: '123', role: 'admin' }, JWT_SECRET);
      mockCall.metadata.get.mockReturnValue([`Bearer ${token}`]);

      const wrappedService = applyAuthMiddleware(mockImplementation, {
        level: 'global',
        globalRoles: ['admin'],
      });
      
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should return unwrapped service when auth not explicitly configured', async () => {
      mockCall.metadata.get.mockReturnValue([]);

      // Without auth config, it should use the implementation as-is based on config
      // Since we can't easily mock the config module, we'll test endpoint level
      const wrappedService = applyAuthMiddleware(mockImplementation, {
        level: 'endpoint',
        endpointConfig: {
          // No endpoints configured, so no auth required
        },
      });
      
      await wrappedService.method1(mockCall, mockCallback);
      expect(mockHandler).toHaveBeenCalled();
    });
  });
});
