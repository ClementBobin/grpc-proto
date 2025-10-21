import { PrismaClient } from '@prisma/client';
import logger from '@/lib/modules/logger.module';

// 🧱 Create the shared Prisma client instance
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

/**
 * 🧪 Test the database connection with automatic reconnection.
 *
 * @param retries - Number of retry attempts before giving up
 * @param delayMs - Delay between retries in milliseconds
 */
export async function testDbConnection(retries = 3, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      logger.info(`✅ Database connection successful (attempt ${attempt})`);
      return; // success → exit loop
    } catch (error) {
      logger.logWithErrorHandling(`❌ Database connection failed (attempt ${attempt} of ${retries}):`, error);

      if (attempt < retries) {
        logger.info(`🔁 Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        logger.error('🚨 All reconnection attempts failed.');
        throw error; // Let caller handle critical failure
      }
    }
  }
}

/**
 * 🧹 Gracefully disconnect Prisma when shutting down.
 */
export async function disconnectDb(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Prisma disconnected cleanly.');
  } catch (error) {
    logger.logWithErrorHandling('⚠️ Failed to disconnect Prisma:', error);
  }
}

/**
 * 🧠 Optional Enhancement: Auto-Reconnect Listener
 *
 * Automatically attempts reconnection when Prisma emits a low-level connection error.
 * This makes the service more resilient to transient DB outages or network hiccups.
 */
prisma.$on('error', async (event) => {
  logger.logWithErrorHandling('⚠️ Prisma connection error detected:', event);
  logger.info('🔁 Attempting automatic reconnection...');

  try {
    await testDbConnection(4, 15000); // 4 retries, 15s delay
    logger.info('✅ Automatic reconnection successful.');
  } catch (error) {
    logger.logWithErrorHandling('❌ Automatic reconnection failed — manual intervention required:', error);
  }
});

export default prisma;