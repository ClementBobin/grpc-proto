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

export const userServiceImplementation = {
  getUser: async (
    call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
    callback: grpc.sendUnaryData<GetUserResponse>
  ) => {
    try {
      const { id } = call.request;
      const user = await UserService.getUser(id);

      if (!user) {
        callback(null, {
          user: undefined,
          error: 'User not found',
        });
        return;
      }

      callback(null, { user });
    } catch (error) {
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
      const input = CreateUserSchema.parse(call.request);
      const user = await UserService.createUser(input);

      callback(null, { user });
    } catch (error) {
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
      const input = UpdateUserSchema.parse(call.request);
      const user = await UserService.updateUser(input);

      if (!user) {
        callback(null, {
          user: undefined,
          error: 'User not found',
        });
        return;
      }

      callback(null, { user });
    } catch (error) {
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
      const success = await UserService.deleteUser(id);

      callback(null, { success });
    } catch (error) {
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
      const result = await UserService.listUsers(page, pageSize);

      callback(null, {
        users: result.users,
        total: result.total,
      });
    } catch (error) {
      callback(null, {
        users: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
