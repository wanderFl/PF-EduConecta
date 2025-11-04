import axios from 'axios';

// Simular la creación de una tarea exactamente como lo hace el frontend
async function testTaskCreationAPI() {
  try {
    console.log('🧪 Testing task creation API...');
    
    // Primero hacer login para obtener un token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@docente.com',
      password: 'password123'
    });
    
    console.log('✅ Login exitoso:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Configurar axios con el token
    const apiClient = axios.create({
      baseURL: 'http://localhost:3000/api',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Datos de prueba exactamente como los envía el frontend
    const taskData = {
      nombre: 'Tarea de Prueba API',
      instrucciones: 'Esta es una tarea de prueba desde la API',
      puntuacion: 20,
      fechaVencimiento: '2025-11-10',
      cursoId: '8vo'
    };
    
    console.log('📤 Enviando datos:', taskData);
    
    // Crear la tarea
    const taskResponse = await apiClient.post('/protected/docente/tareas/create', taskData);
    
    console.log('✅ Respuesta exitosa:', taskResponse.data);
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('💥 Error 500 - Ver logs del servidor para más detalles');
    }
  }
}

testTaskCreationAPI();