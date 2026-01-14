const axios = require('axios');

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN\n');
  console.log('=' . repeat(50));
  
  try {
    // Paso 1: Login
    console.log('\n1️⃣ PASO 1: Login');
    console.log('-'.repeat(50));
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'familia@educonecta.com',
      password: 'Familia2026!'
    });

    console.log('✅ Login exitoso');
    const token = loginResponse.data.token;
    console.log(`Token (primeros 50 chars): ${token.substring(0, 50)}...`);
    
    // Decodificar token
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('\n📋 Payload del token:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Paso 2: Probar endpoint AI
    console.log('\n2️⃣ PASO 2: Probar endpoint AI');
    console.log('-'.repeat(50));
    console.log(`URL: POST http://localhost:3000/api/ai/performance-report/1`);
    console.log(`Authorization: Bearer ${token.substring(0, 30)}...`);
    
    const aiResponse = await axios.post(
      'http://localhost:3000/api/ai/performance-report/1',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Endpoint AI accesible!');
    console.log(`Tipo de reporte: ${aiResponse.data.reportType || 'N/A'}`);
    
  } catch (error) {
    if (error.response) {
      console.log(`\n❌ ERROR ${error.response.status}: ${error.response.statusText}`);
      console.log('Respuesta del servidor:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n🔧 PROBLEMA DETECTADO: Error 401 (Unauthorized)');
        console.log('\n💡 SOLUCIÓN:');
        console.log('1. En tu terminal donde corre el backend, presiona Ctrl+C');
        console.log('2. Ejecuta: npm run dev');
        console.log('3. Espera a ver: "🚀 Server running on port 3000"');
        console.log('4. En el navegador, ejecuta: localStorage.removeItem("token")');
        console.log('5. Recarga la página (F5) y haz login de nuevo');
        console.log('\n⚠️ El backend DEBE reiniciarse para cargar el middleware actualizado');
      }
    } else {
      console.error('\n❌ Error de conexión:', error.message);
      console.log('\n🔧 Verifica que el backend esté corriendo en el puerto 3000');
    }
  }
  
  console.log('\n' + '='.repeat(50));
}

diagnose();
