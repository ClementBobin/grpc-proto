// Import the PrismaClient class from the @prisma/client package
import { PrismaClient } from '@prisma/client';

// Create and export the prisma instance for use in other parts of the application
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

export default prisma;