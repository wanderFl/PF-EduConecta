/**
 * Script para vincular estudiantes a un padre existente
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

// Configuración de CEIAF
const ceiafConfig = {
  host: 'crossover.proxy.rlwy.net',
  port: 36858,
  user: 'root',
  password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
  database: 'colegio_db'
};

async function main() {
  const userEmail = process.argv[2] || 'wanderley.flores@udla.edu.ec';
  
  console.log(`🔗 Vinculando estudiantes a: ${userEmail}\n`);

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { parent: true }
  });

  if (!user) {
    console.log('❌ Usuario no encontrado');
    return;
  }

  if (!user.parent_id) {
    console.log('❌ Usuario no tiene parent_id. Ejecuta migrate-familia-users.js primero');
    return;
  }

  console.log(`✅ Usuario encontrado`);
  console.log(`   Parent ID: ${user.parent_id}\n`);

  // Conectar a CEIAF
  const ceiafConnection = await mysql.createConnection(ceiafConfig);
  
  try {
    const [students] = await ceiafConnection.query(
      'SELECT id_estudiante, cedula, nombres, apellidos FROM estudiantes LIMIT 3'
    );

    console.log(`📚 Estudiantes disponibles: ${students.length}`);
    
    // Verificar vínculos existentes
    const existingLinks = await prisma.parentStudentLink.findMany({
      where: { parent_id: user.parent_id }
    });

    console.log(`📎 Vínculos existentes: ${existingLinks.length}\n`);

    // Crear vínculos para los primeros 2 estudiantes
    const studentsToLink = students.slice(0, 2);
    
    for (const student of studentsToLink) {
      const studentId = String(student.id_estudiante);
      
      // Verificar si ya existe
      const existing = existingLinks.find(l => l.student_external_id === studentId);
      if (existing) {
        console.log(`⚠️  Ya vinculado: ${student.nombres} ${student.apellidos}`);
        continue;
      }

      // Crear vínculo
      await prisma.parentStudentLink.create({
        data: {
          parent_id: user.parent_id,
          student_external_id: studentId
        }
      });

      console.log(`✅ Vinculado: ${student.nombres} ${student.apellidos} (ID: ${student.id_estudiante})`);
    }

    console.log('\n✅ Vínculos completados!');
    console.log('\n💡 Ahora puedes hacer login con:');
    console.log(`   Email: ${userEmail}`);
    console.log('   Password: [tu contraseña]\n');

  } finally {
    await ceiafConnection.end();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
