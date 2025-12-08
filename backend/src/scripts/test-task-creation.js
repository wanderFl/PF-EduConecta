// Script para probar el endpoint de creación de tareas directamente
const { PrismaClient } = require('@prisma/client');

async function testTaskCreation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Probando creación de tarea directamente en Prisma...');
    
    const testTask = {
      title: "Tarea de Prueba",
      instructions: "Esta es una tarea de prueba",
      max_points: 100,
      due_date: new Date('2025-12-31'),
      teacher_external_id: 1,
      course_external_id: 8
    };
    
    console.log('📝 Datos a insertar:', testTask);
    
    const createdTask = await prisma.task.create({
      data: testTask
    });
    
    console.log('✅ Tarea creada exitosamente:', createdTask);
    
    // Verificar que se creó correctamente
    const taskCount = await prisma.task.count();
    console.log('📊 Total de tareas en la BD:', taskCount);
    
  } catch (error) {
    console.error('❌ Error al crear tarea:', error);
    console.error('Stack completo:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testTaskCreation();