/**
 * Script para verificar y actualizar usuarios docentes
 * Asegura que todos los docentes tengan external_id configurado
 * Ejecutar: node scripts/fix-docente-external-id.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDocenteExternalIds() {
  try {
    console.log('🔍 Buscando usuarios docentes sin external_id...\n');

    // Buscar todos los docentes
    const docentes = await prisma.user.findMany({
      where: {
        role: 'DOCENTE'
      },
      select: {
        id: true,
        email: true,
        external_id: true,
        is_active: true
      }
    });

    console.log(`📊 Total de docentes encontrados: ${docentes.length}\n`);

    if (docentes.length === 0) {
      console.log('⚠️  No hay usuarios docentes en la base de datos.');
      console.log('💡 Ejecute: node scripts/create-test-docente.js para crear uno.\n');
      return;
    }

    // Mostrar información de cada docente
    console.log('📋 Docentes en la base de datos:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    for (const docente of docentes) {
      const status = docente.external_id ? '✅ CON external_id' : '❌ SIN external_id';
      const activeStatus = docente.is_active ? '✓ Activo' : '✗ Inactivo';
      
      console.log(`${status} | ${activeStatus}`);
      console.log(`   📧 Email: ${docente.email}`);
      console.log(`   🆔 UUID: ${docente.id}`);
      console.log(`   🔗 External ID: ${docente.external_id || 'NO ASIGNADO'}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Contar docentes sin external_id
    const sinExternalId = docentes.filter(d => !d.external_id);
    
    if (sinExternalId.length === 0) {
      console.log('✅ Todos los docentes tienen external_id configurado correctamente.\n');
      return;
    }

    console.log(`⚠️  ${sinExternalId.length} docente(s) sin external_id:\n`);
    
    for (const docente of sinExternalId) {
      console.log(`   - ${docente.email}`);
    }
    
    console.log('\n💡 Recomendaciones:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. Si es un docente de prueba creado manualmente:');
    console.log('   - Elimínelo: DELETE FROM users WHERE id = \'uuid-del-docente\';');
    console.log('   - Recréelo con: node scripts/create-test-docente.js\n');
    console.log('2. Si es un docente real:');
    console.log('   - Busque su ID en MySQL CEIAF');
    console.log('   - Actualice manualmente:');
    console.log('     UPDATE users SET external_id = \'ID_MYSQL\' WHERE id = \'uuid\';');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📝 Información adicional:');
    console.log('   - El external_id debe corresponder a id_docente en MySQL CEIAF');
    console.log('   - Sin external_id, el docente NO podrá ver cursos ni crear tareas');
    console.log('   - El sistema ahora incluye external_id en el token JWT y respuesta de login\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
fixDocenteExternalIds()
  .then(() => {
    console.log('✅ Verificación completada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
