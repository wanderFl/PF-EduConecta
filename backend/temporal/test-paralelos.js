const axios = require('axios');

async function testParalelosEndpoint() {
  try {
    console.log('🧪 Probando endpoint de paralelos para diferentes cursos...\n');
    
    // Probar diferentes cursos
    for (let courseId = 8; courseId <= 13; courseId++) {
      try {
        const response = await axios.get(`http://localhost:3000/api/students/course/${courseId}/paralelos`);
        console.log(`✅ Curso ${courseId}:`);
        console.log('Paralelos:', response.data.data);
        console.log('Count:', response.data.count);
        console.log('---');
      } catch (error) {
        console.error(`❌ Error en curso ${courseId}:`, error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testParalelosEndpoint();