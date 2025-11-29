require('dotenv').config();
const { PrismaClient } = require('./backend/generated/prisma');

async function verifyExternalId() {
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
      },
      orderBy: {
        email: 'asc'
      }
    });

    console.log(`Total usuarios DOCENTE: ${docentes.length}\n`);
    
    const conExternalId = docentes.filter(d => d.external_id);
    const sinExternalId = docentes.filter(d => !d.external_id);
    
    console.log(`✅ Con external_id: ${conExternalId.length}`);
    console.log(`❌ Sin external_id: ${sinExternalId.length}\n`);
    
    if (docentes.length > 0) {
      console.log('📋 Lista completa de docentes:\n');
      docentes.forEach((d, i) => {
        const status = d.external_id ? '✅' : '❌';
        console.log(`${i + 1}. ${status} ${d.email}`);
        console.log(`   ID Usuario: ${d.id}`);
        console.log(`   External ID: ${d.external_id || '(sin vincular)'}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyExternalId();
