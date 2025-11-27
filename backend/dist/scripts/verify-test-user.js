"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verifyTestUser() {
    try {
        console.log('🔧 Verificando usuario de prueba...');
        const updatedUser = await prisma.user.update({
            where: { email: 'test@docente.com' },
            data: { is_verified: true }
        });
        console.log('✅ Usuario verificado:', updatedUser);
    }
    catch (error) {
        console.error('❌ Error verificando usuario:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
verifyTestUser();
