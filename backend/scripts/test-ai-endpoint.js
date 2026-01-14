const axios = require('axios');

async function testAIEndpoint() {
  try {
    console.log('🧪 PRUEBA COMPLETA DEL ENDPOINT AI\n');
    console.log('='.repeat(60));
    
    // Paso 1: Login
    console.log('\n✅ PASO 1: Login');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'familia@educonecta.com',
      password: 'Familia2026!'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtenido correctamente');
    
    // Paso 2: Llamar al endpoint AI
    console.log('\n🤖 PASO 2: Generando reporte de rendimiento...');
    console.log('Esto puede tardar 30-60 segundos (OpenAI procesando)...\n');
    
    const startTime = Date.now();
    
    const aiResponse = await axios.post(
      'http://localhost:3000/api/ai/performance-report/1',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000
      }
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ ¡Reporte generado exitosamente en ${duration}s!`);
    console.log('\n📊 RESULTADOS:');
    console.log('-'.repeat(60));
    console.log(`Report ID: ${aiResponse.data.report.id}`);
    console.log(`Creado: ${aiResponse.data.report.created_at}`);
    
    if (aiResponse.data.analysis) {
      console.log('\n📝 Análisis:');
      console.log(`Resumen: ${aiResponse.data.analysis.summary?.substring(0, 100)}...`);
      console.log(`Fortalezas: ${aiResponse.data.analysis.strengths?.length || 0}`);
      console.log(`Áreas de mejora: ${aiResponse.data.analysis.areas_of_concern?.length || 0}`);
      console.log(`Recomendaciones: ${aiResponse.data.analysis.recommendations?.length || 0}`);
    }
    
    if (aiResponse.data.metrics) {
      console.log('\n📈 Métricas:');
      console.log(JSON.stringify(aiResponse.data.metrics, null, 2));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PRUEBA COMPLETA EXITOSA');
    console.log('\n💡 Ahora puedes:');
    console.log('1. Abrir el navegador en http://localhost:5173');
    console.log('2. Hacer login con: familia@educonecta.com / Familia2026!');
    console.log('3. Generar reportes de rendimiento desde el dashboard');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Respuesta:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n⚠️ Error de autenticación - El backend necesita reiniciarse');
      } else if (error.response.status === 404) {
        console.log('\n⚠️ Estudiante no encontrado en la base de datos');
      } else if (error.response.status === 500) {
        console.log('\n⚠️ Error del servidor - Verifica logs del backend');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.log('\n⏱️ Timeout - La IA está tardando más de 90 segundos');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️ Backend no está corriendo en el puerto 3000');
    }
  }
}

testAIEndpoint();
