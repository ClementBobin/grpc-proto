import { userServiceImplementation } from '../../src/grpc/user.server';
import { UserService } from '../../src/BL/user.service';
import type { grpc } from '../../src/lib/grpc';

// Mock the UserService
jest.mock('../../src/BL/user.service', () => ({
  UserService: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    listUsers: jest.fn(),
  },
}));

describe('userServiceImplementation', () => {
  let logger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = require('../../src/lib/modules/logger.module').default;
  });

  describe('getUser', () => {
    it('should get user and log info messages', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2025-10-21T08:22:42.377Z',
        updatedAt: '2025-10-21T08:22:42.377Z',
      };

      (UserService.getUser as jest.Mock).mockResolvedValue(mockUser);

      const mockCall = {
        request: { id: '1' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.getUser(mockCall, mockCallback);

      expect(UserService.getUser).toHaveBeenCalledWith('1');
      expect(mockCallback).toHaveBeenCalledWith(null, { user: mockUser });

      // Verify logger was called

      expect(logger.info).toHaveBeenCalledWith('Getting user with id: 1');
      expect(logger.info).toHaveBeenCalledWith('User retrieved successfully: 1');
    });

    it('should handle user not found and log warning', async () => {
      (UserService.getUser as jest.Mock).mockResolvedValue(null);

      const mockCall = {
        request: { id: '999' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.getUser(mockCall, mockCallback);

      expect(UserService.getUser).toHaveBeenCalledWith('999');
      expect(mockCallback).toHaveBeenCalledWith(null, {
        user: undefined,
        error: 'User not found',
      });

      // Verify logger was called

      expect(logger.warn).toHaveBeenCalledWith('User not found: 999');
    });

    it('should handle errors and log them', async () => {
      const mockError = new Error('Database error');
      (UserService.getUser as jest.Mock).mockRejectedValue(mockError);

      const mockCall = {
        request: { id: '1' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.getUser(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        user: undefined,
        error: 'Database error',
      });

      // Verify logger was called with error

      expect(logger.logWithErrorHandling).toHaveBeenCalledWith('Failed to get user', mockError);
    });
  });

  describe('createUser', () => {
    it('should create user and log info messages', async () => {
      const mockInput = {
        email: 'new@example.com',
        name: 'New User',
      };

      const mockUser = {
        id: '2',
        email: 'new@example.com',
        name: 'New User',
        createdAt: '2025-10-21T08:22:42.377Z',
        updatedAt: '2025-10-21T08:22:42.377Z',
      };

      (UserService.createUser as jest.Mock).mockResolvedValue(mockUser);

      const mockCall = {
        request: mockInput,
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.createUser(mockCall, mockCallback);

      expect(UserService.createUser).toHaveBeenCalledWith(mockInput);
      expect(mockCallback).toHaveBeenCalledWith(null, { user: mockUser });

      // Verify logger was called

      expect(logger.info).toHaveBeenCalledWith('Creating new user');
      expect(logger.info).toHaveBeenCalledWith('User created successfully: 2');
    });

    it('should handle creation errors and log them', async () => {
      const mockError = new Error('Duplicate email');
      (UserService.createUser as jest.Mock).mockRejectedValue(mockError);

      const mockCall = {
        request: { email: 'test@example.com', name: 'Test' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.createUser(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        user: undefined,
        error: 'Duplicate email',
      });

      // Verify logger was called with error

      expect(logger.logWithErrorHandling).toHaveBeenCalledWith('Failed to create user', mockError);
    });
  });

  describe('updateUser', () => {
    it('should update user and log info messages', async () => {
      const mockInput = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated User',
      };

      const mockUser = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated User',
        createdAt: '2025-10-21T08:22:42.377Z',
        updatedAt: '2025-10-21T08:22:42.377Z',
      };

      (UserService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      const mockCall = {
        request: mockInput,
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.updateUser(mockCall, mockCallback);

      expect(UserService.updateUser).toHaveBeenCalledWith(mockInput);
      expect(mockCallback).toHaveBeenCalledWith(null, { user: mockUser });

      // Verify logger was called

      expect(logger.info).toHaveBeenCalledWith('Updating user with id: 1');
      expect(logger.info).toHaveBeenCalledWith('User updated successfully: 1');
    });

    it('should handle user not found and log warning', async () => {
      (UserService.updateUser as jest.Mock).mockResolvedValue(null);

      const mockCall = {
        request: { id: '999', email: 'test@example.com' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.updateUser(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        user: undefined,
        error: 'User not found',
      });

      // Verify logger was called

      expect(logger.warn).toHaveBeenCalledWith('User not found for update: 999');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and log info messages', async () => {
      (UserService.deleteUser as jest.Mock).mockResolvedValue(true);

      const mockCall = {
        request: { id: '1' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.deleteUser(mockCall, mockCallback);

      expect(UserService.deleteUser).toHaveBeenCalledWith('1');
      expect(mockCallback).toHaveBeenCalledWith(null, { success: true });

      // Verify logger was called

      expect(logger.info).toHaveBeenCalledWith('Deleting user with id: 1');
      expect(logger.info).toHaveBeenCalledWith('User deleted successfully: 1');
    });

    it('should handle deletion errors and log them', async () => {
      const mockError = new Error('User not found');
      (UserService.deleteUser as jest.Mock).mockRejectedValue(mockError);

      const mockCall = {
        request: { id: '999' },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.deleteUser(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        success: false,
        error: 'User not found',
      });

      // Verify logger was called with error

      expect(logger.logWithErrorHandling).toHaveBeenCalledWith('Failed to delete user', mockError);
    });
  });

  describe('listUsers', () => {
    it('should list users and log info messages', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test1@example.com',
          name: 'Test User 1',
          createdAt: '2025-10-21T08:22:42.377Z',
          updatedAt: '2025-10-21T08:22:42.377Z',
        },
        {
          id: '2',
          email: 'test2@example.com',
          name: 'Test User 2',
          createdAt: '2025-10-21T08:22:42.377Z',
          updatedAt: '2025-10-21T08:22:42.377Z',
        },
      ];

      (UserService.listUsers as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: 2,
      });

      const mockCall = {
        request: { page: 1, pageSize: 10 },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.listUsers(mockCall, mockCallback);

      expect(UserService.listUsers).toHaveBeenCalledWith(1, 10);
      expect(mockCallback).toHaveBeenCalledWith(null, {
        users: mockUsers,
        total: 2,
      });

      // Verify logger was called

      expect(logger.info).toHaveBeenCalledWith('Listing users - page: 1, pageSize: 10');
      expect(logger.info).toHaveBeenCalledWith('Retrieved 2 users');
    });

    it('should handle list errors and log them', async () => {
      const mockError = new Error('Database error');
      (UserService.listUsers as jest.Mock).mockRejectedValue(mockError);

      const mockCall = {
        request: { page: 1, pageSize: 10 },
      } as grpc.ServerUnaryCall<any, any>;

      const mockCallback = jest.fn();

      await userServiceImplementation.listUsers(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        users: [],
        total: 0,
        error: 'Database error',
      });

      // Verify logger was called with error

      expect(logger.logWithErrorHandling).toHaveBeenCalledWith('Failed to list users', mockError);
    });
  });
});
