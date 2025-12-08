// Script de debug para el navegador
// Pega esto en la consola del navegador (F12 -> Console)

console.log('🔍 === DEBUG FRONTEND AUTH ===');

// Verificar localStorage
const authData = localStorage.getItem('authData');
console.log('📦 Auth data en localStorage:', authData);

if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('✅ Auth data parseado:', parsed);
    
    // Verificar si el token está en el formato correcto
    if (parsed.token) {
      console.log('🎫 Token encontrado:', parsed.token.substring(0, 20) + '...');
      
      // Verificar si el token está configurado en axios
      import('/src/services/api.js').then(apiModule => {
        console.log('🔧 Headers de axios:', apiModule.default.defaults.headers);
      });
    } else {
      console.log('❌ No se encontró token en authData');
    }
  } catch (error) {
    console.log('❌ Error parseando authData:', error);
  }
} else {
  console.log('❌ No se encontró authData en localStorage');
}

// Verificar curso seleccionado
const courseData = localStorage.getItem('selectedCourseData');
console.log('📚 Curso seleccionado:', courseData);

console.log('🔍 === FIN DEBUG ===');