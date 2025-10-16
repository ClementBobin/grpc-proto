// Import the PrismaClient class from the @prisma/client package
import { PrismaClient } from '@prisma/client';

import server from '@/server';

// Middleware to automatically update the `UpdatedAt` field before update operations
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

// Function to test the database connection
async function testDbConnection() {
    try {
        // Attempt to connect to the database
        await prisma.$connect();
        // Log a success message if the connection is successful
        console.log('Database connection successful');

        // Close the database connection
        await prisma.$disconnect();
    } catch (error) {
        // Log an error message if the connection fails
        console.error('Database connection failed', error);
        // Log a critical error message and close the server
        console.error('Exiting due to database connection failure');
        server.stop();
    }
}

// Test the database connection immediately when the application starts
testDbConnection();

// Schedule the testDbConnection function to run every hour (3600000 milliseconds)
setInterval(testDbConnection, 60 * 60 * 1000);

// Export the prisma instance for use in other parts of the application
export default prisma;