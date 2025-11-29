/**
 * Script para crear un usuario docente de prueba
 * Ejecutar: node scripts/create-test-docente.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestDocente() {
  try {
    console.log('🔧 Creando usuario docente de prueba...\n');

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'docente.test@educativo.ec' }
    });

    if (existingUser) {
      console.log('⚠️  El usuario docente.test@educativo.ec ya existe.');
      console.log('📋 Información del usuario existente:');
      console.log(`   - ID: ${existingUser.id}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Rol: ${existingUser.role}`);
      console.log(`   - External ID: ${existingUser.external_id || 'No asignado'}`);
      console.log(`   - Activo: ${existingUser.is_active ? 'Sí' : 'No'}\n`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('¿Desea eliminarlo y crear uno nuevo? (s/n): ', async (answer) => {
          readline.close();
          if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
            await prisma.user.delete({ where: { id: existingUser.id } });
            console.log('✅ Usuario anterior eliminado.\n');
            await createNewUser();
            resolve();
          } else {
            console.log('❌ Operación cancelada.');
            resolve();
          }
        });
      });
    } else {
      await createNewUser();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createNewUser() {
  // Hash de la contraseña
  const password = 'Test123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear usuario docente
  const user = await prisma.user.create({
    data: {
      email: 'docente.test@educativo.ec',
      password_hash: hashedPassword,
      role: 'DOCENTE',
      external_id: '5', // ID del docente en MySQL CEIAF
      is_active: true
    }
  });

  console.log('✅ Usuario docente creado exitosamente!\n');
  console.log('📋 Información del usuario:');
  console.log('═══════════════════════════════════════════');
  console.log(`   📧 Email: ${user.email}`);
  console.log(`   🔑 Contraseña: ${password}`);
  console.log(`   👤 Rol: ${user.role}`);
  console.log(`   🆔 ID Usuario (UUID): ${user.id}`);
  console.log(`   🔗 External ID (MySQL): ${user.external_id}`);
  console.log(`   ✓  Estado: ${user.is_active ? 'Activo' : 'Inactivo'}`);
  console.log('═══════════════════════════════════════════\n');

  console.log('📝 Información adicional:');
  console.log('   - Este docente tiene external_id = 5 (María García en MySQL CEIAF)');
  console.log('   - Tiene asignadas materias en varios cursos');
  console.log('   - Puede ver solo los cursos y estudiantes que le corresponden');
  console.log('   - El flujo es: Login → Seleccionar Curso → Seleccionar Materia → Dashboard\n');

  console.log('🧪 Para probar en Postman:');
  console.log('═══════════════════════════════════════════');
  console.log('1. POST http://localhost:3000/api/auth/login');
  console.log('   Body (JSON):');
  console.log('   {');
  console.log('     "email": "docente.test@educativo.ec",');
  console.log('     "password": "Test123!"');
  console.log('   }');
  console.log('');
  console.log('2. Copiar el token de la respuesta');
  console.log('');
  console.log('3. GET http://localhost:3000/api/teachers/5/courses');
  console.log('   Headers:');
  console.log('   Authorization: Bearer {token}');
  console.log('');
  console.log('4. GET http://localhost:3000/api/teachers/5/courses/{courseId}/subjects');
  console.log('   Headers:');
  console.log('   Authorization: Bearer {token}');
  console.log('');
  console.log('5. POST http://localhost:3000/api/tasks');
  console.log('   Headers:');
  console.log('   Authorization: Bearer {token}');
  console.log('   Content-Type: multipart/form-data');
  console.log('   Body:');
  console.log('   - nombre: "Tarea de Prueba"');
  console.log('   - instrucciones: "Descripción de la tarea"');
  console.log('   - fechaEntrega: "2025-12-15"');
  console.log('   - puntuacion: "10"');
  console.log('   - teacherExternalId: "5"');
  console.log('   - courseExternalId: "13" (3ro BGU)');
  console.log('   - subjectId: "5" (Matemáticas)');
  console.log('   - trimestre: "2"');
  console.log('   - aporte: "1"');
  console.log('═══════════════════════════════════════════\n');

  console.log('✨ Flujo Frontend:');
  console.log('   1. Login con las credenciales');
  console.log('   2. Redirige a /docente/courses (selección de curso)');
  console.log('   3. Selecciona un curso → /docente/subjects (selección de materia)');
  console.log('   4. Selecciona una materia → /docente/dashboard');
  console.log('   5. Desde el dashboard puede crear tareas, ver calificaciones, etc.\n');
}

// Ejecutar
createTestDocente()
  .then(() => {
    console.log('✅ Script completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
