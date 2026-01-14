/**
 * Script para verificar usuarios FAMILIA y crear uno de prueba si no existe
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios FAMILIA...\n');

  // Buscar usuarios FAMILIA
  const familiaUsers = await prisma.user.findMany({
    where: { role: 'FAMILIA' },
    include: {
      parent: {
        include: {
          student_links: true
        }
      }
    }
  });

  console.log(`📊 Usuarios FAMILIA encontrados: ${familiaUsers.length}\n`);

  if (familiaUsers.length > 0) {
    familiaUsers.forEach(user => {
      console.log('👤 Usuario:', user.email);
      console.log('   ID:', user.id);
      console.log('   Parent ID:', user.parent_id);
      console.log('   Verificado:', user.is_verified);
      console.log('   Activo:', user.is_active);
      if (user.parent) {
        console.log('   Nombre completo:', user.parent.full_name);
        console.log('   Cédula:', user.parent.cedula);
        console.log('   Estudiantes vinculados:', user.parent.student_links.length);
      }
      console.log('');
    });
  }

  // Preguntar si crear usuario de prueba
  console.log('💡 Para crear un usuario de prueba, ejecuta:');
  console.log('   node scripts/create-test-parent.js\n');

  // Mostrar instrucciones para login
  if (familiaUsers.length > 0) {
    console.log('🔐 Para hacer login, usa estas credenciales:');
    familiaUsers.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: [la que estableciste al registrar]\n`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
