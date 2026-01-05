const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testTareasEntregadas() {
  console.log('🔍 Verificando tareas y entregas en la base de datos...\n');

  try {
    // 1. Verificar tareas existentes
    const tasks = await prisma.task.findMany({
      include: {
        submissions: true
      }
    });
    
    console.log(`📚 Total de tareas: ${tasks.length}\n`);
    
    if (tasks.length === 0) {
      console.log('❌ No hay tareas creadas en el sistema');
      return;
    }
    
    // 2. Mostrar cada tarea con sus entregas
    tasks.forEach((task, index) => {
      console.log(`Tarea ${index + 1}:`);
      console.log(`  ID: ${task.id}`);
      console.log(`  Título: ${task.title}`);
      console.log(`  Curso: ${task.course_external_id}`);
      console.log(`  Docente: ${task.teacher_external_id}`);
      console.log(`  Entregas totales: ${task.submissions.length}`);
      
      if (task.submissions.length > 0) {
        console.log('  📝 Entregas:');
        task.submissions.forEach(sub => {
          console.log(`    - Estudiante ${sub.student_external_id}:`);
          console.log(`      Estado: ${sub.grade !== null ? 'Calificado' : 'Sin calificar'}`);
          console.log(`      Nota: ${sub.grade || 'Sin nota'}`);
          console.log(`      Archivo: ${sub.file_reference || 'Sin archivo'}`);
        });
      } else {
        console.log('  ⚠️  Sin entregas');
      }
      console.log('');
    });
    
    // 3. Resumen de entregas pendientes
    const pendingSubmissions = await prisma.submissionGrade.findMany({
      where: {
        grade: null
      }
    });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total de entregas: ${tasks.reduce((sum, t) => sum + t.submissions.length, 0)}`);
    console.log(`   Entregas pendientes de calificar: ${pendingSubmissions.length}`);
    console.log(`   Entregas calificadas: ${tasks.reduce((sum, t) => sum + t.submissions.length, 0) - pendingSubmissions.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTareasEntregadas();
