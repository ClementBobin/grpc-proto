import type { User, CreateUserInput, UpdateUserInput } from '@/DTO/user.dto';
import prisma from './prismaClient';

export const UserRepository = {
  findById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { id } });
  },

  findAll: async (page: number = 1, pageSize: number = 10): Promise<{ users: User[]; total: number }> => {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      total,
    };
  },

  create: async (input: CreateUserInput): Promise<User> => {
    const data = {
      name: input.name,
      email: input.email,
    };

    return prisma.user.create({ data });
  },

  update: async (input: UpdateUserInput): Promise<User | null> => {
    const existingUser = await prisma.user.findUnique({ where: { id: input.id } });
    if (!existingUser) return null;

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    data.updatedAt = new Date().toISOString();

    return prisma.user.update({ where: { id: input.id }, data });
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await prisma.user.delete({ where: { id } });
    return !!result;
  },
};
