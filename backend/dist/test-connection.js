"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test database connection and server startup
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');
        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`📊 Total users in database: ${userCount}`);
        // Test task table
        const taskCount = await prisma.task.count();
        console.log(`📋 Total tasks in database: ${taskCount}`);
        console.log('🎉 Database is working correctly!');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
    }
    finally {
        await prisma.$disconnect();
    }
}
testConnection();
