const axios = require('axios');

// Test simple para verificar si el servidor está corriendo y probar normalización
async function simpleTest() {
    try {
        console.log('🔍 Verificando si el servidor está corriendo...');
        
        // Test simple - health check
        const healthCheck = await axios.get('http://localhost:3000');
        console.log('✅ Servidor respondiendo:', healthCheck.status);
        
        // Login
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'wanderfhp@hotmail.com',
            password: '123456'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test GET tasks with normalization
        console.log('\n📚 Probando GET /protected/docente/tareas/8 (normalizado)...');
        try {
            const response = await axios.get('http://localhost:3000/api/protected/docente/tareas/8', { headers });
            console.log('✅ GET tasks funciona:', response.data.success ? 'SUCCESS' : 'NO SUCCESS FLAG');
        } catch (error) {
            console.log('❌ GET tasks error:', error.response?.status, error.response?.data?.message || error.message);
        }
        
        // Test POST task creation with course normalization
        console.log('\n🎯 Probando POST task creation con cursoId: "8vo"...');
        try {
            const taskData = {
                nombre: 'Test Normalización Curso',
                instrucciones: 'Esta es una prueba de normalización de cursoId',
                puntuacion: 8.5,
                fechaVencimiento: '2025-11-15T23:59:00.000Z',
                cursoId: '8vo'  // This should be normalized to 8
            };
            
            const response = await axios.post('http://localhost:3000/api/protected/docente/tareas/create', taskData, { headers });
            console.log('✅ POST task creation funciona:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ POST task creation error:', error.response?.status, error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 El servidor no está corriendo en puerto 3000');
        }
    }
}

simpleTest();