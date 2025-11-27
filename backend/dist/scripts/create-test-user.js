"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function createTestUser() {
    try {
        console.log('🔧 Creando usuario de prueba...');
        // Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: 'test@docente.com' }
        });
        if (existingUser) {
            console.log('✅ Usuario ya existe:', existingUser);
            return existingUser;
        }
        // Crear nuevo usuario
        const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
        const newUser = await prisma.user.create({
            data: {
                email: 'test@docente.com',
                password_hash: hashedPassword,
                role: 'DOCENTE',
                external_id: '1',
                is_verified: true
            }
        });
        console.log('✅ Usuario creado:', newUser);
        return newUser;
    }
    catch (error) {
        console.error('❌ Error creando usuario:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestUser();
