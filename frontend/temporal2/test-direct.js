const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testWithDirectTaskCreation() {
  try {
    console.log('🧪 Testing task creation directly...\n');

    // Intentar crear una tarea usando FormData como lo hace el frontend real
    console.log('1. Creating task using FormData (simulating frontend)...');

    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('nombre', 'PRUEBA DIRECTA - Verificar course_external_id');
    form.append('instrucciones', 'Tarea creada directamente para verificar el campo course_external_id en Prisma Studio');
    form.append('puntuacion', '10');
    form.append('fechaVencimiento', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
    form.append('cursoId', '9'); // Probar con curso 9 (9no año)

    // Simular un token de docente válido (necesitarás ajustar esto)
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkN2QzZGYwMy05OGQ0LTRkMzYtODRiOS05OWM4M2VkMjJlNWEiLCJlbWFpbCI6InRlc3QuZG9jZW50ZUBlZHVjb25lY3RhLmNvbSIsInJvbGUiOiJET0NFTlRFIiwiaWF0IjoxNzMxNjE3NzEyfQ.placeholder',
      ...form.getHeaders()
    };

    try {
      const taskResponse = await axios.post(
        `${API_BASE}/protected/docente/tareas/create`,
        form,
        { headers }
      );
      console.log('✅ Task created with FormData:', taskResponse.data);
    } catch (error) {
      console.log('⚠️ FormData method failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 2. Método alternativo: crear directamente en la base de datos usando un script de backend
    console.log('\n2. Alternative: Let\'s create a direct database test...');
    
    console.log('\n💡 SOLUCIÓN ALTERNATIVA:');
    console.log('Dado que necesitamos verificar rápidamente que el campo se guarda:');
    console.log('1. Ve a Prisma Studio: http://localhost:5556');
    console.log('2. Ve a la tabla "Task"');
    console.log('3. Crea manualmente una tarea con estos datos:');
    console.log('   - title: "Tarea Manual - Verificar Campo"');
    console.log('   - course_external_id: 8');
    console.log('   - teacher_external_id: 1');
    console.log('   - due_date: fecha futura');
    console.log('4. Verifica que el campo course_external_id aparece correctamente');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithDirectTaskCreation();