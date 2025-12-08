// Script para probar la API del backend
const axios = require('axios');

async function testBackendAPI() {
  console.log('🧪 Probando API del backend...\n');
  
  try {
    // Test 1: Ruta de prueba
    console.log('1. Probando ruta de test...');
    const testResponse = await axios.get('http://localhost:3000/api/test');
    console.log('✅ Ruta de test funciona:', testResponse.data);
  } catch (error) {
    console.log('❌ Error en ruta de test:', error.message);
  }

  try {
    // Test 2: Lista de rutas
    console.log('\n2. Probando lista de rutas...');
    const routesResponse = await axios.get('http://localhost:3000/api/routes');
    console.log('✅ Rutas disponibles:', routesResponse.data);
  } catch (error) {
    console.log('❌ Error obteniendo rutas:', error.message);
  }

  try {
    // Test 3: Ruta de creación de tareas (sin autenticación - esperamos 401)
    console.log('\n3. Probando ruta de creación de tareas (sin auth)...');
    const taskResponse = await axios.post('http://localhost:3000/api/docente/tareas/create', {
      nombre: 'Test Task',
      fechaVencimiento: '2025-12-01',
      cursoId: '8vo'
    });
    console.log('✅ Respuesta inesperada (debería ser 401):', taskResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Ruta existe pero requiere autenticación (correcto):', error.response.status);
    } else if (error.response && error.response.status === 404) {
      console.log('❌ Ruta no encontrada (404):', error.response.status);
    } else {
      console.log('❌ Error inesperado:', error.message);
    }
  }
}

testBackendAPI();