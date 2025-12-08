const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testBasicAPI() {
  try {
    console.log('🧪 Testing basic API endpoints...\n');

    // 1. Test health endpoint
    console.log('1. Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      console.log('✅ Server is healthy:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // 2. Test courses endpoint (should work without auth if it's public)
    console.log('\n2. Testing courses endpoint...');
    try {
      const coursesResponse = await axios.get(`${API_BASE}/students/courses`);
      console.log('✅ Courses endpoint accessible:', coursesResponse.data);
    } catch (error) {
      console.log('❌ Courses endpoint error:', error.response?.status, error.response?.data || error.message);
    }

    // 3. Test task creation endpoint (should require auth)
    console.log('\n3. Testing task creation without auth (should fail)...');
    try {
      const taskResponse = await axios.post(`${API_BASE}/protected/docente/tareas/create`, {
        nombre: 'Test Task',
        instrucciones: 'Test instructions',
        puntuacion: 10,
        fechaVencimiento: new Date().toISOString(),
        cursoId: '8'
      });
      console.log('❌ Task creation should have failed but succeeded:', taskResponse.data);
    } catch (error) {
      console.log('✅ Task creation correctly requires auth:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicAPI();