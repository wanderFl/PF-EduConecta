const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testCourseSelection() {
  try {
    console.log('🧪 Testing course selection in task creation...\n');

    // 1. Login como docente
    console.log('1. Logging in as teacher...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testdocente@example.com',
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

    // 2. Obtener lista de cursos disponibles
    console.log('\n2. Getting available courses...');
    const coursesResponse = await axios.get(`${API_BASE}/students/courses`, { headers });
    
    if (!coursesResponse.data.success) {
      throw new Error('Failed to get courses: ' + JSON.stringify(coursesResponse.data));
    }

    const courses = coursesResponse.data.data;
    console.log('✅ Courses retrieved:', courses.length);
    console.log('Available courses:', courses.map(c => `${c.id_curso}: ${c.nombre} - ${c.paralelo}`));

    // 3. Crear tareas para diferentes cursos
    const taskTests = [
      { courseId: 8, taskName: 'Matemáticas - Álgebra Básica' },
      { courseId: 9, taskName: 'Ciencias - Sistema Solar' },
      { courseId: 10, taskName: 'Lenguaje - Ensayo Argumentativo' }
    ];

    console.log('\n3. Creating tasks for different courses...');

    for (const test of taskTests) {
      console.log(`\n   Creating task for course ${test.courseId}: ${test.taskName}`);
      
      const taskPayload = {
        nombre: test.taskName,
        instrucciones: `Instrucciones para ${test.taskName}. Esta tarea fue creada automáticamente para probar la selección de curso.`,
        puntuacion: Math.floor(Math.random() * 10) + 1,
        fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde hoy
        cursoId: test.courseId.toString()
      };

      try {
        const taskResponse = await axios.post(
          `${API_BASE}/protected/docente/tareas/create`,
          taskPayload,
          { headers }
        );

        if (taskResponse.data.success) {
          console.log(`   ✅ Task created successfully:`, {
            id: taskResponse.data.task.id,
            title: taskResponse.data.task.title,
            course_id: taskResponse.data.task.course_external_id,
            due_date: taskResponse.data.task.due_date
          });
        } else {
          console.log(`   ❌ Task creation failed:`, taskResponse.data);
        }
      } catch (error) {
        console.log(`   ❌ Error creating task for course ${test.courseId}:`, error.response?.data || error.message);
      }
    }

    // 4. Verificar las tareas creadas consultando por cada curso
    console.log('\n4. Verifying tasks were created with correct course assignment...');
    
    for (const test of taskTests) {
      try {
        console.log(`\n   Checking tasks for course ${test.courseId}...`);
        const tasksResponse = await axios.get(
          `${API_BASE}/protected/docente/tareas/${test.courseId}`,
          { headers }
        );

        if (tasksResponse.data.success) {
          const courseTasks = tasksResponse.data.tasks || [];
          const matchingTasks = courseTasks.filter(task => 
            task.title && task.title.includes(test.taskName.split(' - ')[0])
          );

          console.log(`   ✅ Found ${matchingTasks.length} matching tasks for course ${test.courseId}`);
          matchingTasks.forEach(task => {
            console.log(`      - ${task.title} (ID: ${task.id}, Course: ${task.course_external_id})`);
          });
        } else {
          console.log(`   ❌ Failed to get tasks for course ${test.courseId}:`, tasksResponse.data);
        }
      } catch (error) {
        console.log(`   ❌ Error getting tasks for course ${test.courseId}:`, error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Test completed! Check Prisma Studio to verify the tasks were saved correctly with the right course_external_id.');
    console.log('\nTo open Prisma Studio, run:');
    console.log('cd backend && npm run prisma:studio');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Ejecutar el test
testCourseSelection();