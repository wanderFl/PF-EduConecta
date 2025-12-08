/**
 * Script de prueba para verificar la funcionalidad de trimestre y aporte en tareas
 */
const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@docente.com';
const TEST_PASSWORD = 'password123';

async function testTrimestreAporte() {
    console.log('🧪 === PRUEBA DE TRIMESTRE Y APORTE ===\n');
    
    try {
        // 1. Login
        console.log('📋 1. Iniciando sesión...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        }, {
            withCredentials: true
        });
        
        console.log('✅ Login exitoso');
        
        // Obtener token de la respuesta
        const token = loginResponse.data.token;
        if (!token) {
            throw new Error('No se recibió token del login');
        }
        
        console.log('🔑 Token obtenido correctamente');
        
        // 2. Crear tarea con trimestre y aporte
        console.log('\n📋 2. Creando tarea con trimestre y aporte...');
        
        const taskData = {
            nombre: 'Tarea de Prueba - Trimestre y Aporte',
            instrucciones: 'Esta es una tarea de prueba para validar los campos de trimestre y aporte',
            puntuacion: 10,
            fechaVencimiento: '2024-12-20',
            cursoId: '8', // 8vo año
            paralelo: 'A',
            trimestre: 1, // Primer trimestre
            aporte: 1     // Aporte 1
        };
        
        const createResponse = await axios.post(
            `${BASE_URL}/api/protected/docente/tareas/create`, 
            taskData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Tarea creada exitosamente:');
        console.log('   - ID:', createResponse.data.task?.id);
        console.log('   - Título:', createResponse.data.task?.title);
        console.log('   - Trimestre:', createResponse.data.task?.trimestre);
        console.log('   - Aporte:', createResponse.data.task?.aporte);
        
        // 3. Verificar que la tarea se guardó correctamente
        console.log('\n📋 3. Verificando tarea en base de datos...');
        
        const taskId = createResponse.data.task?.id;
        if (taskId) {
            const getResponse = await axios.get(
                `${BASE_URL}/api/tasks/${taskId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            const task = getResponse.data.data;
            console.log('✅ Tarea verificada en base de datos:');
            console.log('   - Trimestre:', task.trimestre);
            console.log('   - Aporte:', task.aporte);
            console.log('   - Paralelo:', task.paralelo);
            console.log('   - Curso:', task.course_external_id);
        }
        
        // 4. Probar validaciones
        console.log('\n📋 4. Probando validaciones...');
        
        // Probar trimestre inválido
        try {
            await axios.post(
                `${BASE_URL}/api/protected/docente/tareas/create`, 
                {
                    ...taskData,
                    nombre: 'Tarea con trimestre inválido',
                    trimestre: 5 // Inválido
                },
                {
                    headers: {
                        'Cookie': cookieHeader,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('❌ ERROR: Debería haber rechazado trimestre inválido');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validación de trimestre funcionando correctamente');
            } else {
                console.log('⚠️  Error inesperado en validación de trimestre:', error.response?.status);
            }
        }
        
        // Probar aporte inválido
        try {
            await axios.post(
                `${BASE_URL}/api/protected/docente/tareas/create`, 
                {
                    ...taskData,
                    nombre: 'Tarea con aporte inválido',
                    aporte: 3 // Inválido
                },
                {
                    headers: {
                        'Cookie': cookieHeader,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('❌ ERROR: Debería haber rechazado aporte inválido');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validación de aporte funcionando correctamente');
            } else {
                console.log('⚠️  Error inesperado en validación de aporte:', error.response?.status);
            }
        }
        
        console.log('\n🎉 === TODAS LAS PRUEBAS COMPLETADAS ===');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.response?.data || error.message);
    }
}

// Ejecutar pruebas
testTrimestreAporte();