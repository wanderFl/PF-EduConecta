// Script para probar el flujo completo de autenticación y creación de tareas
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testFullFlow() {
  console.log('🧪 Probando flujo completo: Login + Crear Tarea...\n');
  
  try {
    // Paso 1: Intentar login (probablemente fallará si no hay usuario)
    console.log('1. Intentando login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'docente@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Paso 2: Configurar token para próximas peticiones
    const apiWithAuth = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Paso 3: Intentar crear tarea
    console.log('2. Intentando crear tarea...');
    const taskData = {
      nombre: 'Tarea de Prueba',
      instrucciones: 'Esta es una tarea de prueba',
      puntuacion: 100,
      fechaVencimiento: '2025-12-01T23:59:59Z',
      cursoId: '8vo'
    };
    
    const taskResponse = await apiWithAuth.post('/docente/tareas/create', taskData);
    console.log('✅ Tarea creada exitosamente:', taskResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Error ${error.response.status}:`, error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n💡 Sugerencia: Necesitas crear un usuario docente primero');
        console.log('   Comando: cd backend && npm run debug-auth');
      } else if (error.response.status === 404) {
        console.log('\n💡 La ruta no existe. Verificando configuración...');
        // Probar ruta de test
        try {
          await axios.get(`${API_BASE}/test`);
          console.log('✅ Servidor funciona, problema específico con la ruta de tareas');
        } catch (testError) {
          console.log('❌ Problema general con el servidor');
        }
      }
    } else {
      console.log('❌ Error de conexión:', error.message);
      console.log('\n💡 Verifica que el backend esté ejecutándose en puerto 3000');
    }
  }
}

testFullFlow();