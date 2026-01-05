const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createTestSubmission() {
  console.log('📝 Creando tarea de prueba con entrega sin calificar...\n');

  try {
    // Buscar una tarea existente del docente 1, curso 8
    const task = await prisma.task.findFirst({
      where: {
        teacher_external_id: 1,
        course_external_id: 8
      }
    });

    if (!task) {
      console.log('❌ No se encontró ninguna tarea del docente 1 en el curso 8');
      console.log('💡 Crea una tarea primero desde el dashboard de docente');
      return;
    }

    console.log(`✅ Tarea encontrada: "${task.title}"`);
    console.log(`   ID: ${task.id}\n`);

    // Verificar si ya existe una entrega del estudiante 1
    const existingSubmission = await prisma.submissionGrade.findFirst({
      where: {
        task_id: task.id,
        student_external_id: 1
      }
    });

    if (existingSubmission && existingSubmission.grade === null) {
      console.log('✅ Ya existe una entrega sin calificar del estudiante 1');
      return;
    }

    if (existingSubmission) {
      console.log('⚠️  Ya existe una entrega del estudiante 1 (calificada)');
      console.log('💡 Usando estudiante 2 para la prueba...');
      
      // Crear entrega para estudiante 2
      const submission = await prisma.submissionGrade.create({
        data: {
          task_id: task.id,
          student_external_id: 2,
          grade: null, // Sin calificar
          file_reference: null,
          student_comment: 'Tarea entregada - esperando calificación',
          course_external_id: task.course_external_id,
          subject_external_id: task.subject_external_id,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          submitted_at: new Date()
        }
      });

      console.log('✅ Entrega de prueba creada exitosamente!');
      console.log(`   Estudiante: 2`);
      console.log(`   Tarea: ${task.title}`);
      console.log(`   Estado: Sin calificar\n`);
      console.log('🎉 Ahora deberías ver esta tarea en "Tareas Entregadas" del dashboard');
      
    } else {
      // Crear entrega para estudiante 1
      const submission = await prisma.submissionGrade.create({
        data: {
          task_id: task.id,
          student_external_id: 1,
          grade: null, // Sin calificar
          file_reference: null,
          student_comment: 'Tarea entregada - esperando calificación',
          course_external_id: task.course_external_id,
          subject_external_id: task.subject_external_id,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          submitted_at: new Date()
        }
      });

      console.log('✅ Entrega de prueba creada exitosamente!');
      console.log(`   Estudiante: 1`);
      console.log(`   Tarea: ${task.title}`);
      console.log(`   Estado: Sin calificar\n`);
      console.log('🎉 Ahora deberías ver esta tarea en "Tareas Entregadas" del dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSubmission();
