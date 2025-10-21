import prisma from '@/DAL/prismaClient';

export const InfraRepository = {
  getHealthStatus: async () => {
    try {
      // Test database connection
      await prisma.$connect();
      
      // Create a health check record
      const healthCheck = await prisma.healthCheck.create({
        data: {
          status: 'healthy',
        },
      });
      
      return {
        status: 'healthy',
        timestamp: healthCheck.timestamp.toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await prisma.$disconnect();
    }
  },
  
  disconnect: async () => {
    await prisma.$disconnect();
  },
};
