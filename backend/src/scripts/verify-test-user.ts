import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

async function verifyTestUser() {
  try {
    console.log('🔧 Verificando usuario de prueba...');
    
    const updatedUser = await prisma.user.update({
      where: { email: 'test@docente.com' },
      data: { is_verified: true }
    });
    
    console.log('✅ Usuario verificado:', updatedUser);
    
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestUser();