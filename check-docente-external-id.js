const { PrismaClient } = require('./backend/generated/prisma');

async function checkDocenteExternalId() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando usuarios DOCENTE...\n');
    
    const docentes = await prisma.user.findMany({
      where: {
        role: 'DOCENTE'
      },
      select: {
        id: true,
        email: true,
        external_id: true,
        role: true
      }
    });

    console.log(`Total usuarios DOCENTE encontrados: ${docentes.length}\n`);
    
    const conExternalId = docentes.filter(d => d.external_id);
    const sinExternalId = docentes.filter(d => !d.external_id);
    
    console.log(`✅ Con external_id: ${conExternalId.length}`);
    console.log(`❌ Sin external_id: ${sinExternalId.length}\n`);
    
    if (conExternalId.length > 0) {
      console.log('📋 Usuarios con external_id:');
      conExternalId.forEach(d => {
        console.log(`  - ${d.email} → external_id: ${d.external_id}`);
      });
      console.log('');
    }
    
    if (sinExternalId.length > 0) {
      console.log('⚠️  Usuarios sin external_id (necesitan vinculación):');
      sinExternalId.forEach(d => {
        console.log(`  - ${d.email} (id: ${d.id})`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocenteExternalId();
