import { UserService } from '@/BL/user.service';
import { CreateUserSchema, UpdateUserSchema } from '@/DTO/user.dto';
import type { grpc } from '@/lib/grpc';
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
import logger from '@/lib/modules/logger.module';

export const userServiceImplementation = {
  getUser: async (
    call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
    callback: grpc.sendUnaryData<GetUserResponse>
  ) => {
    logger.debug(`[userServiceImplementation.getUser] Request received for user id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const user = await UserService.getUser(id);

      if (!user) {
        logger.warn(`[userServiceImplementation.getUser] User not found: ${id}`);
        callback(null, {
          user: undefined,
          error: 'User not found',
        });
        return;
      }

      logger.info(`[userServiceImplementation.getUser] User found: ${id}`);
      callback(null, { user });
    } catch (error) {
      logger.logWithErrorHandling('[userServiceImplementation.getUser] Error in getUser', error);
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
    logger.debug('[userServiceImplementation.createUser] Request received to create user');
    try {
      const input = CreateUserSchema.parse(call.request);
      logger.debug(`[userServiceImplementation.createUser] Validated input for email: ${input.email}`);
      const user = await UserService.createUser(input);

      logger.info(`[userServiceImplementation.createUser] User created successfully with id: ${user.id}`);
      callback(null, { user });
    } catch (error) {
      logger.logWithErrorHandling('[userServiceImplementation.createUser] Error in createUser', error);
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
    logger.debug(`[userServiceImplementation.updateUser] Request received to update user id: ${call.request.id}`);
    try {
      const input = UpdateUserSchema.parse(call.request);
      logger.debug(`[userServiceImplementation.updateUser] Validated input for user id: ${input.id}`);
      const user = await UserService.updateUser(input);

      if (!user) {
        logger.warn(`[userServiceImplementation.updateUser] User not found: ${input.id}`);
        callback(null, {
          user: undefined,
          error: 'User not found',
        });
        return;
      }

      logger.info(`[userServiceImplementation.updateUser] User updated successfully: ${input.id}`);
      callback(null, { user });
    } catch (error) {
      logger.logWithErrorHandling('[userServiceImplementation.updateUser] Error in updateUser', error);
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
    logger.debug(`[userServiceImplementation.deleteUser] Request received to delete user id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const success = await UserService.deleteUser(id);

      logger.info(`[userServiceImplementation.deleteUser] User ${id} deletion ${success ? 'successful' : 'failed'}`);
      callback(null, { success });
    } catch (error) {
      logger.logWithErrorHandling('[userServiceImplementation.deleteUser] Error in deleteUser', error);
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
    logger.debug(`[userServiceImplementation.listUsers] Request received with page: ${call.request.page}, pageSize: ${call.request.pageSize}`);
    try {
      const { page = 1, pageSize = 10 } = call.request;
      const result = await UserService.listUsers(page, pageSize);

      logger.info(`[userServiceImplementation.listUsers] Retrieved ${result.users.length} users out of ${result.total} total`);
      callback(null, {
        users: result.users,
        total: result.total,
      });
    } catch (error) {
      logger.logWithErrorHandling('[userServiceImplementation.listUsers] Error in listUsers', error);
      callback(null, {
        users: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
