// Test específico para la petición que está fallando
const { PrismaClient } = require('../../generated/prisma');

async function testExactPayload() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Probando payload exacto del frontend...');
    
    // Datos exactos que envía el frontend según los logs
    const frontendPayload = {
      nombre: 'w',
      instrucciones: 's',
      puntuacion: 10,
      fechaVencimiento: '2025-11-04',
      cursoId: '8vo'
    };
    
    console.log('📥 Payload del frontend:', frontendPayload);
    
    // Simular la lógica del backend
    const courseIdMapping = {
      '8vo': 8,
      '9no': 9,
      '10mo': 10,
      '1bgu': 11,
      '2bgu': 12,
      '3bgu': 13
    };
    
    // Convertir cursoId
    const courseExternalId = courseIdMapping[frontendPayload.cursoId.toString()];
    console.log('🔄 courseExternalId:', courseExternalId);
    
    // Convertir puntuacion
    const maxPoints = frontendPayload.puntuacion ? parseInt(frontendPayload.puntuacion.toString(), 10) : null;
    console.log('🔄 maxPoints:', maxPoints);
    
    // Probar diferentes formas de manejar la fecha
    console.log('📅 Probando fechas...');
    
    // Forma 1: Fecha simple (como viene del frontend)
    try {
      const dueDate1 = new Date(frontendPayload.fechaVencimiento);
      console.log('✅ Fecha 1 (simple):', dueDate1);
    } catch (e) {
      console.log('❌ Error fecha 1:', e.message);
    }
    
    // Forma 2: Fecha con hora por defecto
    try {
      const dueDate2 = new Date(`${frontendPayload.fechaVencimiento}T23:59:59.000Z`);
      console.log('✅ Fecha 2 (con hora):', dueDate2);
    } catch (e) {
      console.log('❌ Error fecha 2:', e.message);
    }
    
    // Intentar crear la tarea con los datos exactos
    const taskData = {
      title: frontendPayload.nombre,
      instructions: frontendPayload.instrucciones || null,
      max_points: maxPoints,
      due_date: new Date(`${frontendPayload.fechaVencimiento}T23:59:59.000Z`),
      teacher_external_id: 1,
      course_external_id: courseExternalId
    };
    
    console.log('📝 Datos finales para Prisma:', taskData);
    
    const createdTask = await prisma.task.create({
      data: taskData
    });
    
    console.log('✅ Tarea creada exitosamente:', createdTask);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.error('📋 Stack completo:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testExactPayload();