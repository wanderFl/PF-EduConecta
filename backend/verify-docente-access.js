const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDocenteUsers() {
  try {
    console.log('🔍 Verificando usuarios DOCENTE...\n');
    
    const docentes = await prisma.user.findMany({
      where: { role: 'DOCENTE' },
      select: {
        id: true,
        email: true,
        role: true,
        external_id: true,
        createdAt: true
      }
    });

    if (docentes.length === 0) {
      console.log('❌ No se encontraron usuarios con rol DOCENTE');
      return;
    }

    console.log(`✅ Encontrados ${docentes.length} usuarios DOCENTE:\n`);
    
    docentes.forEach((docente, index) => {
      console.log(`${index + 1}. Email: ${docente.email}`);
      console.log(`   ID: ${docente.id}`);
      console.log(`   Rol: ${docente.role}`);
      console.log(`   External ID: ${docente.external_id || 'NO CONFIGURADO'}`);
      console.log(`   Creado: ${docente.createdAt}`);
      console.log('');
    });

    // Verificar cuántos tienen external_id
    const withExternalId = docentes.filter(d => d.external_id !== null);
    const withoutExternalId = docentes.filter(d => d.external_id === null);

    console.log('\n📊 Resumen:');
    console.log(`   - Con external_id: ${withExternalId.length}`);
    console.log(`   - Sin external_id: ${withoutExternalId.length}`);
    
    if (withoutExternalId.length > 0) {
      console.log('\n⚠️ Usuarios sin external_id (pueden tener acceso limitado):');
      withoutExternalId.forEach(d => console.log(`   - ${d.email}`));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDocenteUsers();
