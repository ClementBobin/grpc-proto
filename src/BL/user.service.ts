import { UserRepository } from '@/DAL/user.repository';
import type { User, CreateUserInput, UpdateUserInput } from '@/DTO/user.dto';

export const UserService = {
  getUser: async (id: string): Promise<User | null> => {
    return UserRepository.findById(id);
  },

  createUser: async (input: CreateUserInput): Promise<User> => {
    return UserRepository.create(input);
  },

  updateUser: async (input: UpdateUserInput): Promise<User | null> => {
    return UserRepository.update(input);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    return UserRepository.delete(id);
  },

  listUsers: async (page: number = 1, pageSize: number = 10): Promise<{ users: User[]; total: number }> => {
    return UserRepository.findAll(page, pageSize);
  },
};
