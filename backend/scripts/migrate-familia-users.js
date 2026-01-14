/**
 * Script para migrar usuarios FAMILIA existentes sin parent_id
 * Crea un registro Parent para cada usuario FAMILIA que no tenga uno
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrando usuarios FAMILIA sin parent_id...\n');

  // Buscar usuarios FAMILIA sin parent_id
  const usersWithoutParent = await prisma.user.findMany({
    where: {
      role: 'FAMILIA',
      parent_id: null
    }
  });

  console.log(`📊 Usuarios sin parent_id: ${usersWithoutParent.length}\n`);

  if (usersWithoutParent.length === 0) {
    console.log('✅ Todos los usuarios FAMILIA ya tienen parent_id');
    return;
  }

  // Migrar cada usuario
  for (const user of usersWithoutParent) {
    console.log(`👤 Migrando: ${user.email}`);

    try {
      await prisma.$transaction(async (tx) => {
        // Crear parent
        const parent = await tx.parent.create({
          data: {
            full_name: user.email.split('@')[0].replace(/[._]/g, ' '),
            cedula: null,
            home_address: null,
            work_place: null,
            security_pin_hash: await bcrypt.hash('1234', 10) // PIN por defecto
          }
        });

        // Actualizar user con parent_id
        await tx.user.update({
          where: { id: user.id },
          data: { parent_id: parent.id }
        });

        console.log(`   ✅ Parent creado con ID: ${parent.id}`);
        console.log(`   📝 PIN de seguridad por defecto: 1234`);
      });
    } catch (error) {
      console.error(`   ❌ Error migrando ${user.email}:`, error.message);
    }
  }

  console.log('\n✅ Migración completada!');
  console.log('\n💡 Ahora puedes:');
  console.log('   1. Hacer login con tu email y contraseña');
  console.log('   2. Vincular estudiantes desde el dashboard');
  console.log('   3. Usar PIN de seguridad: 1234 (cámbialo después)\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
