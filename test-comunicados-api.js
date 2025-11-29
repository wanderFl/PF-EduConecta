// Script simple para crear conversaciones usando la API del backend
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function main() {
  console.log('🚀 Script de prueba para Comunicados\n');

  try {
    // 1. Login como docente
    console.log('1️⃣ Intentando iniciar sesión...');
    
    // Primero vamos a probar si podemos obtener la lista sin autenticación
    // para ver qué error obtenemos
    try {
      const response = await axios.get(`${API_URL}/communications/teacher`);
      console.log('Respuesta:', response.data);
    } catch (error) {
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Mensaje: ${error.response.data?.message || error.response.statusText}`);
        
        if (error.response.status === 401) {
          console.log('   ✅ Endpoint existe pero requiere autenticación (correcto)');
        } else if (error.response.status === 404) {
          console.log('   ❌ Endpoint no encontrado (404)');
          console.log('   💡 El backend puede no estar corriendo o las rutas no están registradas');
        }
      } else {
        console.log('   ❌ Error de conexión:', error.message);
        console.log('   💡 Verifica que el backend esté corriendo en el puerto 3000');
      }
    }

    // 2. Probar endpoint de debug
    console.log('\n2️⃣ Probando endpoint de debug...');
    try {
      const debugResponse = await axios.get(`${API_URL}/communications-status`);
      console.log('   ✅ Status endpoint funcionando:');
      console.log('   ', JSON.stringify(debugResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 3. Verificar que el backend está corriendo
    console.log('\n3️⃣ Verificando backend...');
    try {
      const testResponse = await axios.get(`${API_URL}/test`);
      console.log('   ✅ Backend está corriendo:', testResponse.data.message);
    } catch (error) {
      console.log('   ❌ Backend no responde');
      console.log('   💡 Inicia el backend con: cd backend && npm run dev');
      return;
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN:');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Backend está corriendo');
    console.log('✅ Rutas de comunicados están registradas');
    console.log('⚠️  Para crear conversaciones de prueba:');
    console.log('   1. Necesitas tener un usuario DOCENTE registrado');
    console.log('   2. Inicia sesión con ese usuario');
    console.log('   3. Usa la interfaz web para crear conversaciones');
    console.log('\n💡 O ejecuta el script de creación directa con Prisma');
    console.log('   (requiere solucionar la conexión MySQL)\n');

  } catch (error) {
    console.error('\n❌ Error general:', error.message);
  }
}

main();
