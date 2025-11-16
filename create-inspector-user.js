/**
 * Script para crear un usuario INSPECTOR automáticamente
 */
const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';

const INSPECTOR_DATA = {
    email: 'inspector.prueba@educacion.ec',
    password: 'password123',
    role: 'INSPECTOR'
};

async function createInspectorUser() {
    console.log('🔧 === CREANDO USUARIO INSPECTOR ===\n');
    
    try {
        console.log('📝 Enviando petición de registro...');
        console.log('   Email:', INSPECTOR_DATA.email);
        console.log('   Role:', INSPECTOR_DATA.role);
        
        const response = await axios.post(`${BASE_URL}/api/auth/register`, INSPECTOR_DATA, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n✅ ¡Usuario INSPECTOR creado exitosamente!');
        console.log('   Response:', response.data);
        
        // Intentar login inmediatamente
        console.log('\n🔐 Probando login del usuario creado...');
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: INSPECTOR_DATA.email,
            password: INSPECTOR_DATA.password
        });
        
        console.log('✅ ¡Login exitoso!');
        console.log('   User ID:', loginResponse.data.user.id);
        console.log('   Email:', loginResponse.data.user.email);
        console.log('   Role:', loginResponse.data.user.role);
        console.log('   Token generado:', loginResponse.data.token ? 'SÍ' : 'NO');
        
        console.log('\n🎯 USUARIO INSPECTOR LISTO PARA USAR');
        console.log('💡 Ahora puedes ejecutar: node test-inspector-complete.js');
        
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            console.log('ℹ️  El usuario INSPECTOR ya existe');
            console.log('🔐 Probando login...');
            
            try {
                const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                    email: INSPECTOR_DATA.email,
                    password: INSPECTOR_DATA.password
                });
                
                console.log('✅ Usuario existente puede hacer login correctamente');
                console.log('   Role:', loginResponse.data.user.role);
                console.log('💡 Ejecuta: node test-inspector-complete.js');
                
            } catch (loginError) {
                console.log('❌ Usuario existe pero no puede hacer login');
                console.log('   Error:', loginError.response?.data?.message || loginError.message);
            }
        } else {
            console.error('❌ Error creando usuario INSPECTOR:');
            console.error('   Status:', error.response?.status);
            console.error('   Message:', error.response?.data?.message || error.message);
            console.error('   Data:', error.response?.data);
        }
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    createInspectorUser();
}

module.exports = { createInspectorUser, INSPECTOR_DATA };