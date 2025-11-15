const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
  try {
    console.log('=== Probando autenticación completa ===');
    
    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'wanderfhp@hotmail.com',
      password: '123456'
    });
    
    console.log('Login exitoso:', {
      token: loginResponse.data.token?.substring(0, 20) + '...',
      user: loginResponse.data.user
    });
    
    const token = loginResponse.data.token;
    
    // 2. Test endpoint básico protegido
    console.log('\n2. Probando endpoint básico protegido...');
    const userResponse = await axios.get(`${BASE_URL}/protected/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('User endpoint:', userResponse.status);
    
    // 3. Test endpoint de tareas de curso (que funcionaba antes)
    console.log('\n3. Probando endpoint de tareas por curso...');
    const tasksResponse = await axios.get(`${BASE_URL}/protected/docente/tareas/8`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Tasks endpoint:', tasksResponse.status, tasksResponse.data);
    
    // 4. Test los nuevos endpoints problemáticos
    if (tasksResponse.data.tasks && tasksResponse.data.tasks.length > 0) {
      const firstTask = tasksResponse.data.tasks[0];
      console.log('\n4. Probando endpoints nuevos con tarea:', firstTask.id);
      
      // Test task detail
      try {
        const taskDetailResponse = await axios.get(`${BASE_URL}/protected/docente/tareas/detail/${firstTask.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Task detail endpoint:', taskDetailResponse.status);
      } catch (error) {
        console.log('❌ Task detail endpoint error:', error.response?.status, error.response?.data);
      }
      
      // Test submissions
      try {
        const submissionsResponse = await axios.get(`${BASE_URL}/protected/docente/tareas/${firstTask.id}/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Submissions endpoint:', submissionsResponse.status);
      } catch (error) {
        console.log('❌ Submissions endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('=== ERROR ===');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testAuth();