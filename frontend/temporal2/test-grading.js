const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TEST_CREDENTIALS = {
    email: 'docente@test.com',
    password: 'password123'
};

async function testGradingEndpoints() {
    try {
        console.log('🔐 Iniciando sesión como docente...');
        
        // 1. Login
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, TEST_CREDENTIALS);
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // 2. Test getting tasks for a course
        console.log('\n📚 Probando obtener tareas del curso 8vo...');
        try {
            const tasksResponse = await axios.get(`${API_BASE}/protected/docente/tareas/8vo`, { headers });
            console.log('✅ Tareas obtenidas:', JSON.stringify(tasksResponse.data, null, 2));
            
            // 3. If there are tasks, try to grade one
            if (tasksResponse.data.success && tasksResponse.data.tasks.length > 0) {
                const firstTask = tasksResponse.data.tasks[0];
                console.log(`\n🎯 Probando calificar tarea: ${firstTask.title}`);
                
                if (firstTask.students.length > 0) {
                    const firstStudent = firstTask.students[0];
                    console.log(`Calificando estudiante: ${firstStudent.nombre_completo} (ID: ${firstStudent.id})`);
                    
                    const gradeResponse = await axios.post(
                        `${API_BASE}/protected/docente/tareas/${firstTask.id}/calificar`,
                        {
                            studentId: firstStudent.id,
                            grade: 8.5
                        },
                        { headers }
                    );
                    
                    console.log('✅ Calificación registrada:', JSON.stringify(gradeResponse.data, null, 2));
                } else {
                    console.log('ℹ️ No hay estudiantes en este curso para calificar');
                }
            } else {
                console.log('ℹ️ No hay tareas en este curso');
            }
        } catch (error) {
            if (error.response) {
                console.log('❌ Error obteniendo tareas:', error.response.data);
            } else {
                console.error('❌ Error de conexión:', error.message);
            }
        }
        
        // 4. Test file download endpoint
        console.log('\n📥 Probando endpoint de descarga de archivos...');
        try {
            const fileResponse = await axios.get(`${API_BASE}/protected/docente/files/tasks/nonexistent.pdf`, { headers });
            console.log('✅ Respuesta de archivo:', fileResponse.status);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Endpoint de archivos funciona correctamente (404 esperado para archivo inexistente)');
            } else {
                console.log('❌ Error inesperado en endpoint de archivos:', error.response?.data || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.response?.data || error.message);
    }
}

// Execute the test
testGradingEndpoints();