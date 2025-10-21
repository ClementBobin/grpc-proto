import { UserService } from '@/BL/user.service';
import { CreateUserSchema, UpdateUserSchema } from '@/DTO/user.dto';
import type { grpc } from '@/lib/grpc';
import logger from '@/lib/modules/logger.module';
import type {
  GetUserRequest,
  GetUserResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  ListUsersRequest,
  ListUsersResponse,
} from '@/DTO/user.dto';

export const userServiceImplementation = {
  getUser: async (
    call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
    callback: grpc.sendUnaryData<GetUserResponse>
  ) => {
    try {
      const { id } = call.request;
      logger.info(`Getting user with id: ${id}`);
      const user = await UserService.getUser(id);

      if (!user) {
        logger.warn(`User not found: ${id}`);
        callback(null, {
          user: undefined,
          error: 'User not found',
        });
        return;
      }

      logger.info(`User retrieved successfully: ${id}`);
      callback(null, { user });
    } catch (error) {
      logger.logWithErrorHandling('Failed to get user', error);
      callback(null, {
        user: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  createUser: async (
    call: grpc.ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
    callback: grpc.sendUnaryData<CreateUserResponse>
  ) => {
    try {
      logger.info('Creating new user');
      const input = CreateUserSchema.parse(call.request);
      const user = await UserService.createUser(input);

      logger.info(`User created successfully: ${user.id}`);
      callback(null, { user });
    } catch (error) {
      logger.logWithErrorHandling('Failed to create user', error);
      callback(null, {
        user: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  updateUser: async (
    call: grpc.ServerUnaryCall<UpdateUserRequest, UpdateUserResponse>,
    callback: grpc.sendUnaryData<UpdateUserResponse>
  ) => {
    try {
      logger.info(`Updating user with id: ${call.request.id}`);
      const input = UpdateUserSchema.parse(call.request);
      const user = await UserService.updateUser(input);

      if (!user) {
        logger.warn(`User not found for update: ${call.request.id}`);
        callback(null, {
          user: undefined,
          error: 'User not found',
        });
        return;
      }

      logger.info(`User updated successfully: ${user.id}`);
      callback(null, { user });
    } catch (error) {
      logger.logWithErrorHandling('Failed to update user', error);
      callback(null, {
        user: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  deleteUser: async (
    call: grpc.ServerUnaryCall<DeleteUserRequest, DeleteUserResponse>,
    callback: grpc.sendUnaryData<DeleteUserResponse>
  ) => {
    try {
      const { id } = call.request;
      logger.info(`Deleting user with id: ${id}`);
      const success = await UserService.deleteUser(id);

      logger.info(`User deleted successfully: ${id}`);
      callback(null, { success });
    } catch (error) {
      logger.logWithErrorHandling('Failed to delete user', error);
      callback(null, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  listUsers: async (
    call: grpc.ServerUnaryCall<ListUsersRequest, ListUsersResponse>,
    callback: grpc.sendUnaryData<ListUsersResponse>
  ) => {
    try {
      const { page = 1, pageSize = 10 } = call.request;
      logger.info(`Listing users - page: ${page}, pageSize: ${pageSize}`);
      const result = await UserService.listUsers(page, pageSize);

      logger.info(`Retrieved ${result.users.length} users`);
      callback(null, {
        users: result.users,
        total: result.total,
      });
    } catch (error) {
      logger.logWithErrorHandling('Failed to list users', error);
      callback(null, {
        users: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};

// Export service implementation with service auth
export { userServiceImplementation as userServiceImplementationWithAuth };
