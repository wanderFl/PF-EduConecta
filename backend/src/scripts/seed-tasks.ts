import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

async function seedTasks() {
  try {
    console.log('🌱 Creando tareas de prueba...');

    // Crear algunas tareas de ejemplo
    const task1 = await prisma.task.create({
      data: {
        title: 'Tarea de Matemáticas - Álgebra',
        instructions: 'Resolver los ejercicios del capítulo 5, páginas 120-125. Entregar con procedimiento completo.',
        due_date: new Date('2025-11-15T23:59:00Z'),
        max_points: 10,
        teacher_external_id: 1,
        course_external_id: 8,
      }
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Ensayo de Lenguaje - Literatura Ecuatoriana',
        instructions: 'Escribir un ensayo de 500 palabras sobre la obra "Cumandá" de Juan León Mera.',
        due_date: new Date('2025-11-20T23:59:00Z'),
        max_points: 15,
        teacher_external_id: 2,
        course_external_id: 9,
      }
    });

    const task3 = await prisma.task.create({
      data: {
        title: 'Proyecto de Ciencias - Ecosistemas',
        instructions: 'Crear una maqueta del ecosistema amazónico ecuatoriano y presentar sus características.',
        due_date: new Date('2025-11-12T23:59:00Z'),
        max_points: 20,
        teacher_external_id: 3,
        course_external_id: 10,
      }
    });

    const task4 = await prisma.task.create({
      data: {
        title: 'Tarea de Historia - Independencia',
        instructions: 'Investigar y resumir los eventos principales de la independencia del Ecuador.',
        due_date: new Date('2025-11-25T23:59:00Z'),
        max_points: 12,
        teacher_external_id: 1,
        course_external_id: 11,
      }
    });

    const task5 = await prisma.task.create({
      data: {
        title: 'Experimento de Química - Reacciones',
        instructions: 'Realizar el experimento de combustión y documentar resultados en el reporte de laboratorio.',
        due_date: new Date('2025-11-10T23:59:00Z'), // Esta ya está vencida para pruebas
        max_points: 18,
        teacher_external_id: 4,
        course_external_id: 12,
      }
    });

    const task6 = await prisma.task.create({
      data: {
        title: 'Presentación de Inglés - My Future Plans',
        instructions: 'Preparar una presentación oral de 5 minutos sobre planes futuros usando future tenses.',
        due_date: new Date('2025-11-13T23:59:00Z'),
        max_points: 10,
        teacher_external_id: 5,
        course_external_id: 13,
      }
    });

    // Crear algunas entregas de ejemplo
    await prisma.submissionGrade.create({
      data: {
        task_id: task1.id,
        student_external_id: 101,
        grade: 8.5,
        comment_teacher: 'Buen trabajo, pero falta mejorar en la presentación.',
        submitted_at: new Date('2025-11-09T10:30:00Z'),
        graded_at: new Date('2025-11-10T14:20:00Z'),
      }
    });

    await prisma.submissionGrade.create({
      data: {
        task_id: task1.id,
        student_external_id: 102,
        submitted_at: new Date('2025-11-09T15:45:00Z'),
        comment_student: 'Adjunto los ejercicios resueltos paso a paso.',
      }
    });

    await prisma.submissionGrade.create({
      data: {
        task_id: task2.id,
        student_external_id: 103,
        grade: 14.0,
        comment_teacher: 'Excelente análisis literario y uso del lenguaje.',
        submitted_at: new Date('2025-11-08T16:30:00Z'),
        graded_at: new Date('2025-11-09T09:15:00Z'),
      }
    });

    await prisma.submissionGrade.create({
      data: {
        task_id: task3.id,
        student_external_id: 104,
        submitted_at: new Date('2025-11-11T08:20:00Z'),
        comment_student: 'Maqueta terminada, incluye explicación de flora y fauna.',
      }
    });

    console.log('✅ Tareas de prueba creadas exitosamente:');
    console.log(`📚 ${task1.title}`);
    console.log(`📝 ${task2.title}`);
    console.log(`🔬 ${task3.title}`);
    console.log(`🏛️ ${task4.title}`);
    console.log(`⚗️ ${task5.title}`);
    console.log(`🗣️ ${task6.title}`);
    console.log('\n📊 También se crearon algunas entregas y calificaciones de ejemplo.');
    
  } catch (error) {
    console.error('❌ Error creando tareas de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script solo si es llamado directamente
if (require.main === module) {
  seedTasks();
}

export { seedTasks };