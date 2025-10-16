import type { User, CreateUserInput, UpdateUserInput } from '@/DTO/user.dto';

// Mock data store (in production, this would use Prisma)
const users: Map<string, User> = new Map();
let idCounter = 1;

export const UserRepository = {
  findById: async (id: string): Promise<User | null> => {
    return users.get(id) || null;
  },

  findAll: async (page: number = 1, pageSize: number = 10): Promise<{ users: User[]; total: number }> => {
    const allUsers = Array.from(users.values());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      users: allUsers.slice(start, end),
      total: allUsers.length,
    };
  },

  create: async (input: CreateUserInput): Promise<User> => {
    const id = `user_${idCounter++}`;
    const now = new Date().toISOString();
    
    const user: User = {
      id,
      name: input.name,
      email: input.email,
      createdAt: now,
      updatedAt: now,
    };
    
    users.set(id, user);
    return user;
  },

  update: async (input: UpdateUserInput): Promise<User | null> => {
    const existingUser = users.get(input.id);
    if (!existingUser) {
      return null;
    }

    const updatedUser: User = {
      ...existingUser,
      name: input.name ?? existingUser.name,
      email: input.email ?? existingUser.email,
      updatedAt: new Date().toISOString(),
    };

    users.set(input.id, updatedUser);
    return updatedUser;
  },

  delete: async (id: string): Promise<boolean> => {
    return users.delete(id);
  },
};
