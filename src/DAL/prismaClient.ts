import { PrismaClient } from '@prisma/client';

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
      console.log(`✅ Database connection successful (attempt ${attempt})`);
      return; // success → exit loop
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${attempt} of ${retries}):`, error);

      if (attempt < retries) {
        console.log(`🔁 Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error('🚨 All reconnection attempts failed.');
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
    console.log('🔌 Prisma disconnected cleanly.');
  } catch (error) {
    console.error('⚠️ Failed to disconnect Prisma:', error);
  }
}

/**
 * 🧠 Optional Enhancement: Auto-Reconnect Listener
 *
 * Automatically attempts reconnection when Prisma emits a low-level connection error.
 * This makes the service more resilient to transient DB outages or network hiccups.
 */
prisma.$on('error', async (event) => {
  console.error('⚠️ Prisma connection error detected:', event);
  console.log('🔁 Attempting automatic reconnection...');

  try {
    await testDbConnection(4, 15000); // 4 retries, 15s delay
    console.log('✅ Automatic reconnection successful.');
  } catch (error) {
    console.error('❌ Automatic reconnection failed — manual intervention required:', error);
  }
});

export default prisma;
