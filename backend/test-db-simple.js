const { PrismaClient } = require('./generated/prisma');

async function testDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    
    // Probar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Contar tareas existentes
    const taskCount = await prisma.task.count();
    console.log(`📝 Tareas existentes en la BD: ${taskCount}`);
    
    // Listar algunas tareas
    const tasks = await prisma.task.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    });
    
    console.log('📋 Últimas 5 tareas:');
    tasks.forEach(task => {
      console.log(`  - ${task.title} (Curso: ${task.course_external_id}, Profesor: ${task.teacher_external_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL no está corriendo. Inicia PostgreSQL y intenta de nuevo.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDB();