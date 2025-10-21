import { UserRepository } from '@/DAL/user.repository';
import type { User, CreateUserInput, UpdateUserInput } from '@/DTO/user.dto';
import logger from '@/lib/modules/logger.module';

export const UserService = {
  getUser: async (id: string): Promise<User | null> => {
    logger.debug(`[UserService.getUser] Getting user with id: ${id}`);
    try {
      const user = await UserRepository.findById(id);
      logger.debug(`[UserService.getUser] User ${id} ${user ? 'retrieved' : 'not found'}`);
      return user;
    } catch (error) {
      logger.logWithErrorHandling('[UserService.getUser] Error getting user', error);
      throw error;
    }
  },

  createUser: async (input: CreateUserInput): Promise<User> => {
    logger.info(`[UserService.createUser] Creating user with email: ${input.email}`);
    try {
      const user = await UserRepository.create(input);
      logger.info(`[UserService.createUser] User created successfully with id: ${user.id}`);
      return user;
    } catch (error) {
      logger.logWithErrorHandling('[UserService.createUser] Error creating user', error);
      throw error;
    }
  },

  updateUser: async (input: UpdateUserInput): Promise<User | null> => {
    logger.info(`[UserService.updateUser] Updating user with id: ${input.id}`);
    try {
      const user = await UserRepository.update(input);
      logger.info(`[UserService.updateUser] User ${input.id} ${user ? 'updated successfully' : 'not found'}`);
      return user;
    } catch (error) {
      logger.logWithErrorHandling('[UserService.updateUser] Error updating user', error);
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    logger.info(`[UserService.deleteUser] Deleting user with id: ${id}`);
    try {
      const result = await UserRepository.delete(id);
      logger.info(`[UserService.deleteUser] User ${id} ${result ? 'deleted successfully' : 'deletion failed'}`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[UserService.deleteUser] Error deleting user', error);
      throw error;
    }
  },

  listUsers: async (page: number = 1, pageSize: number = 10): Promise<{ users: User[]; total: number }> => {
    logger.debug(`[UserService.listUsers] Listing users - page: ${page}, pageSize: ${pageSize}`);
    try {
      const result = await UserRepository.findAll(page, pageSize);
      logger.debug(`[UserService.listUsers] Retrieved ${result.users.length} users out of ${result.total} total`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[UserService.listUsers] Error listing users', error);
      throw error;
    }
  },
};
