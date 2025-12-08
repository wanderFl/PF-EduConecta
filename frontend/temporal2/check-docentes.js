// Script para verificar usuarios docentes y sus external_id
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'backend', 'generated', 'prisma'));

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios DOCENTE en la base de datos...\n');
  
  const docentes = await prisma.user.findMany({
    where: { role: 'DOCENTE' },
    select: {
      id: true,
      email: true,
      external_id: true
    }
  });

  if (docentes.length === 0) {
    console.log('❌ No se encontraron usuarios con rol DOCENTE');
    return;
  }

  console.log(`✅ Se encontraron ${docentes.length} usuarios DOCENTE:\n`);
  
  docentes.forEach((doc, i) => {
    console.log(`${i + 1}. Email: ${doc.email}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   External ID: ${doc.external_id || '❌ NO CONFIGURADO'}`);
    console.log('');
  });

  // Verificar conversaciones por docente
  console.log('\n📊 Verificando conversaciones por docente:\n');
  
  for (const doc of docentes) {
    if (!doc.external_id) {
      console.log(`${doc.email}: ❌ No tiene external_id configurado`);
      continue;
    }
    
    const teacherIdInt = parseInt(doc.external_id, 10);
    const conversations = await prisma.conversation.findMany({
      where: {
        teacher_external_id: teacherIdInt
      }
    });
    
    console.log(`${doc.email}: ${conversations.length} conversaciones`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
