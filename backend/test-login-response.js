// Script para verificar que el backend devuelve external_id correctamente
const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/auth/login', {
      email: 'docentecolegio@hotmail.com',
      password: 'docente123' // Ajusta la contraseña si es diferente
    });

    console.log('✅ Login exitoso!');
    console.log('📦 Respuesta del backend:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.user.external_id) {
      console.log('\n✅ external_id presente:', response.data.user.external_id);
    } else {
      console.log('\n❌ external_id NO presente en la respuesta');
    }
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
  }
}

testLogin();
