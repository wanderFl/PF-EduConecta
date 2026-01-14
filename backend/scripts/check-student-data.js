const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStudentData() {
  try {
    // Conectar a MySQL (CEIAF)
    const mysqlConn = await mysql.createConnection({
      host: 'crossover.proxy.rlwy.net',
      port: 36858,
      user: 'root',
      password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
      database: 'colegio_db'
    });

    // 1. Obtener estudiante vinculado a familia@educonecta.com
    console.log('🔍 Buscando estudiante vinculado...\n');
    
    const parent = await prisma.parent.findFirst({
      where: {
        user: { email: 'familia@educonecta.com' }
      },
      include: {
        student_links: true
      }
    });

    if (!parent || parent.student_links.length === 0) {
      console.log('❌ No hay estudiante vinculado a familia@educonecta.com');
      await mysqlConn.end();
      return;
    }

    const studentExternalId = parent.student_links[0].student_external_id;
    console.log(`✅ Estudiante vinculado: ID ${studentExternalId}\n`);

    // 2. Obtener info del estudiante
    const [students] = await mysqlConn.execute(
      'SELECT id, nombre, apellido, curso_id, paralelo FROM estudiantes WHERE id = ?',
      [studentExternalId]
    );

    if (students.length === 0) {
      console.log('❌ Estudiante no encontrado en MySQL');
      await mysqlConn.end();
      return;
    }

    const student = students[0];
    console.log('📋 Información del estudiante:');
    console.log(`   Nombre: ${student.nombre} ${student.apellido}`);
    console.log(`   Curso: ${student.curso_id}${student.paralelo}\n`);

    // 3. Verificar calificaciones
    const [grades] = await mysqlConn.execute(
      'SELECT COUNT(*) as count FROM calificaciones WHERE estudiante_id = ?',
      [studentExternalId]
    );
    console.log(`📊 Calificaciones: ${grades[0].count}`);

    // 4. Verificar asistencia
    const [attendance] = await mysqlConn.execute(
      'SELECT COUNT(*) as count FROM asistencias WHERE estudiante_id = ?',
      [studentExternalId]
    );
    console.log(`📅 Asistencias: ${attendance[0].count}`);

    // 5. Verificar comportamiento
    const [behavior] = await mysqlConn.execute(
      'SELECT COUNT(*) as count FROM comportamiento WHERE estudiante_id = ?',
      [studentExternalId]
    );
    console.log(`🎯 Comportamiento: ${behavior[0].count}\n`);

    // 6. Mostrar datos existentes si los hay
    if (grades[0].count > 0) {
      const [gradeDetails] = await mysqlConn.execute(
        `SELECT m.nombre as materia, c.calificacion, c.trimestre 
         FROM calificaciones c 
         JOIN materias m ON c.materia_id = m.id 
         WHERE c.estudiante_id = ? 
         ORDER BY c.trimestre, m.nombre 
         LIMIT 10`,
        [studentExternalId]
      );
      console.log('📚 Calificaciones recientes:');
      gradeDetails.forEach(g => {
        console.log(`   - ${g.materia}: ${g.calificacion}/10 (Trimestre ${g.trimestre})`);
      });
      console.log();
    }

    // Determinar si se necesitan datos
    const needsData = grades[0].count === 0 || attendance[0].count === 0 || behavior[0].count === 0;
    
    if (needsData) {
      console.log('⚠️  PROBLEMA DETECTADO: Faltan datos para generar reporte de IA');
      console.log('\n💡 SOLUCIÓN: Ejecuta el siguiente script:');
      console.log('   node backend/scripts/create-student-data.js');
    } else {
      console.log('✅ El estudiante tiene datos suficientes');
      console.log('\n🤖 Si el reporte de IA está vacío, el problema está en el servicio de IA');
    }

    await mysqlConn.end();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentData();
