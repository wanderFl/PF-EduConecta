const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testTaskCourseField() {
  try {
    console.log('🧪 Testing task creation with course_external_id field...\n');

    // 1. Registrar un usuario docente de prueba
    console.log('1. Registering test teacher...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: 'test.docente@educonecta.com',
        password: 'password123',
        role: 'DOCENTE'
      });
      console.log('✅ Teacher registered successfully:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message?.includes('already exists')) {
        console.log('✅ Teacher already exists, proceeding with login');
      } else {
        console.log('⚠️ Registration error:', error.response?.data || error.message);
      }
    }

    // 2. Login como docente
    console.log('\n2. Logging in as teacher...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.docente@educonecta.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + JSON.stringify(loginResponse.data));
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 3. Crear una tarea específicamente para curso 8 (8vo año)
    console.log('\n3. Creating test task for course 8...');
    
    const taskPayload = {
      nombre: 'PRUEBA - Tarea para verificar course_external_id',
      instrucciones: 'Esta tarea fue creada para verificar que el campo course_external_id se guarde correctamente en Prisma.',
      puntuacion: 10,
      fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cursoId: '8' // Este debe mapearse a course_external_id = 8
    };

    console.log('Payload enviado:', JSON.stringify(taskPayload, null, 2));

    const taskResponse = await axios.post(
      `${API_BASE}/protected/docente/tareas/create`,
      taskPayload,
      { headers }
    );

    if (taskResponse.data.success) {
      console.log('\n✅ Task created successfully!');
      console.log('Task details:', {
        id: taskResponse.data.task.id,
        title: taskResponse.data.task.title,
        course_external_id: taskResponse.data.task.course_external_id,
        teacher_external_id: taskResponse.data.task.teacher_external_id,
        due_date: taskResponse.data.task.due_date
      });

      console.log('\n🎯 VERIFICACIÓN:');
      console.log('1. Abre Prisma Studio en: http://localhost:5556');
      console.log('2. Ve a la tabla "Task"');
      console.log('3. Busca la tarea con ID:', taskResponse.data.task.id);
      console.log('4. Verifica que course_external_id = 8');
      
      // 4. Verificar consultando las tareas del curso 8
      console.log('\n4. Verifying by querying course 8 tasks...');
      const verifyResponse = await axios.get(
        `${API_BASE}/protected/docente/tareas/8`,
        { headers }
      );

      if (verifyResponse.data.success) {
        const courseTasks = verifyResponse.data.tasks || [];
        const ourTask = courseTasks.find(task => task.id === taskResponse.data.task.id);
        
        if (ourTask) {
          console.log('✅ Task found in course 8 query! course_external_id is working correctly.');
          console.log('Task in course list:', {
            id: ourTask.id,
            title: ourTask.title,
            course_external_id: ourTask.course_external_id
          });
        } else {
          console.log('❌ Task NOT found in course 8 query. There might be an issue.');
        }
      }

    } else {
      console.log('❌ Task creation failed:', taskResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTaskCourseField();