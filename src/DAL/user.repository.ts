import type { User, CreateUserInput, UpdateUserInput } from '@/DTO/user.dto';
import prisma from '@/DAL/prismaClient';
import logger from '@/lib/modules/logger.module';

export const UserRepository = {
  findById: async (id: string): Promise<User | null> => {
    logger.debug(`[UserRepository.findById] Finding user by id: ${id}`);
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      logger.debug(`[UserRepository.findById] User ${id} ${user ? 'found' : 'not found'}`);
      return user;
    } catch (error) {
      logger.logWithErrorHandling('[UserRepository.findById] Error finding user by id', error);
      throw error;
    }
  },

  findAll: async (page: number = 1, pageSize: number = 10): Promise<{ users: User[]; total: number }> => {
    logger.debug(`[UserRepository.findAll] Finding users - page: ${page}, pageSize: ${pageSize}`);
    try {
      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.user.count(),
      ]);

      logger.debug(`[UserRepository.findAll] Found ${users.length} users out of ${total} total`);
      return {
        users,
        total,
      };
    } catch (error) {
      logger.logWithErrorHandling('[UserRepository.findAll] Error finding users', error);
      throw error;
    }
  },

  create: async (input: CreateUserInput): Promise<User> => {
    logger.debug(`[UserRepository.create] Creating user with email: ${input.email}`);
    try {
      const data = {
        name: input.name,
        email: input.email,
      };

      const user = await prisma.user.create({ data });
      logger.info(`[UserRepository.create] User created successfully with id: ${user.id}`);
      return user;
    } catch (error) {
      logger.logWithErrorHandling('[UserRepository.create] Error creating user', error);
      throw error;
    }
  },

  update: async (input: UpdateUserInput): Promise<User | null> => {
    logger.debug(`[UserRepository.update] Updating user with id: ${input.id}`);
    try {
      const existingUser = await prisma.user.findUnique({ where: { id: input.id } });
      if (!existingUser) {
        logger.debug(`[UserRepository.update] User not found with id: ${input.id}`);
        return null;
      }

      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.email !== undefined) data.email = input.email;
      data.updatedAt = new Date().toISOString();

      const updatedUser = await prisma.user.update({ where: { id: input.id }, data });
      logger.info(`[UserRepository.update] User updated successfully with id: ${input.id}`);
      return updatedUser;
    } catch (error) {
      logger.logWithErrorHandling('[UserRepository.update] Error updating user', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    logger.debug(`[UserRepository.delete] Deleting user with id: ${id}`);
    try {
      const result = await prisma.user.delete({ where: { id } });
      logger.info(`[UserRepository.delete] User deleted successfully with id: ${id}`);
      return !!result;
    } catch (error) {
      logger.logWithErrorHandling('[UserRepository.delete] Error deleting user', error);
      throw error;
    }
  },
};
