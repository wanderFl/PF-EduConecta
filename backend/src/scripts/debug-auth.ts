import { PrismaClient } from '../../generated/prisma';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🧪 Creando usuarios de prueba...\n');

  try {
    // Crear usuario docente
    const docentePassword = await hashPassword('password123');
    const docente = await prisma.user.upsert({
      where: { email: 'docente@test.com' },
      update: {},
      create: {
        email: 'docente@test.com',
        password_hash: docentePassword,
        role: 'DOCENTE',
        external_id: '123',
        is_verified: true,
        is_active: true
      }
    });
    console.log('✅ Usuario docente creado:', {
      id: docente.id,
      email: docente.email,
      role: docente.role
    });

    // Crear usuario directivo
    const directivoPassword = await hashPassword('password123');
    const directivo = await prisma.user.upsert({
      where: { email: 'directivo@test.com' },
      update: {},
      create: {
        email: 'directivo@test.com',
        password_hash: directivoPassword,
        role: 'DIRECTIVO',
        external_id: '456',
        is_verified: true,
        is_active: true
      }
    });
    console.log('✅ Usuario directivo creado:', {
      id: directivo.id,
      email: directivo.email,
      role: directivo.role
    });

    // Crear usuario familia
    const familiaPassword = await hashPassword('password123');
    const familia = await prisma.user.upsert({
      where: { email: 'familia@test.com' },
      update: {},
      create: {
        email: 'familia@test.com',
        password_hash: familiaPassword,
        role: 'FAMILIA',
        is_verified: true,
        is_active: true
      }
    });
    console.log('✅ Usuario familia creado:', {
      id: familia.id,
      email: familia.email,
      role: familia.role
    });

    console.log('\n🎯 Credenciales de prueba:');
    console.log('Docente: docente@test.com / password123');
    console.log('Directivo: directivo@test.com / password123');
    console.log('Familia: familia@test.com / password123');

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();