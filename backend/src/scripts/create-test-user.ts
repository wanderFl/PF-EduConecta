import { Role, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    const hashedPassword = await bcrypt.hash('password123', 10);
    
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
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();