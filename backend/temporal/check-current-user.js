require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('./generated/prisma');

async function decodeStoredToken() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Ingresa el token JWT que está guardado en localStorage del navegador\n');
    console.log('Para obtenerlo:');
    console.log('1. Abre las DevTools del navegador (F12)');
    console.log('2. Ve a Application > Local Storage > http://localhost:5173');
    console.log('3. Busca la clave "authToken" y copia su valor\n');
    console.log('O simplemente revisa la consola del navegador y busca el token en las requests\n');
    
    // Por ahora, vamos a listar todos los usuarios DOCENTE y sus external_id
    console.log('📋 Lista de todos los usuarios DOCENTE en el sistema:\n');
    
    const docentes = await prisma.user.findMany({
      where: { role: 'DOCENTE' },
      select: {
        id: true,
        email: true,
        external_id: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (docentes.length === 0) {
      console.log('❌ No hay usuarios con rol DOCENTE en el sistema');
      return;
    }
    
    docentes.forEach((docente, index) => {
      console.log(`${index + 1}. Email: ${docente.email}`);
      console.log(`   ID: ${docente.id}`);
      console.log(`   External ID: ${docente.external_id || '❌ SIN VINCULAR'}`);
      console.log(`   Creado: ${docente.createdAt}`);
      console.log('');
    });
    
    console.log('\n💡 Para diagnosticar el problema:');
    console.log('1. Verifica con qué email estás intentando acceder');
    console.log('2. Confirma que ese usuario aparece en la lista de arriba');
    console.log('3. Verifica que ese usuario tiene external_id configurado\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

decodeStoredToken();
