export const mockPrismaClient = {
  healthCheck: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      status: 'healthy',
      timestamp: new Date('2025-10-16T06:34:37.817Z'),
    }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../src/generated/prisma', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));
