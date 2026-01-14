const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createStudentData() {
  try {
    const mysqlConn = await mysql.createConnection({
      host: 'crossover.proxy.rlwy.net',
      port: 36858,
      user: 'root',
      password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
      database: 'colegio_db'
    });

    // 1. Obtener estudiante vinculado
    console.log('🔍 Buscando estudiante vinculado a familia@educonecta.com...\n');
    
    const parent = await prisma.parent.findFirst({
      where: {
        user: { email: 'familia@educonecta.com' }
      },
      include: {
        student_links: true
      }
    });

    if (!parent || parent.student_links.length === 0) {
      console.log('❌ No hay estudiante vinculado');
      await mysqlConn.end();
      return;
    }

    const studentId = parent.student_links[0].student_external_id;
    console.log(`✅ Estudiante ID: ${studentId}\n`);

    // 2. Obtener info del estudiante
    const [students] = await mysqlConn.execute(
      'SELECT id_estudiante, nombres, apellidos, id_curso FROM estudiantes WHERE id_estudiante = ?',
      [studentId]
    );

    if (students.length === 0) {
      console.log('❌ Estudiante no encontrado en MySQL');
      await mysqlConn.end();
      return;
    }

    const student = students[0];
    console.log('📋 Estudiante:', student.nombres, student.apellidos);
    console.log(`   Curso ID: ${student.id_curso}\n`);

    // 3. Obtener materias disponibles
    const [materias] = await mysqlConn.execute('SELECT id_materia, nombre FROM materias LIMIT 5');
    console.log('📚 Materias disponibles:', materias.length);

    // 4. Crear calificaciones si no existen
    const [existingGrades] = await mysqlConn.execute(
      'SELECT COUNT(*) as count FROM calificaciones WHERE id_estudiante = ?',
      [studentId]
    );

    if (existingGrades[0].count === 0) {
      console.log('\n📝 Creando calificaciones...');
      
      for (const materia of materias) {
        // Trimestre 1
        const grade1 = (Math.random() * 3 + 7).toFixed(1); // 7.0 a 10.0
        await mysqlConn.execute(
          `INSERT INTO calificaciones (id_estudiante, id_materia, trimestre, calificacion, observaciones) 
           VALUES (?, ?, 1, ?, 'Generado por sistema')`,
          [studentId, materia.id_materia, grade1]
        );

        // Trimestre 2
        const grade2 = (Math.random() * 3 + 7).toFixed(1);
        await mysqlConn.execute(
          `INSERT INTO calificaciones (id_estudiante, id_materia, trimestre, calificacion, observaciones) 
           VALUES (?, ?, 2, ?, 'Generado por sistema')`,
          [studentId, materia.id_materia, grade2]
        );

        console.log(`   ✅ ${materia.nombre}: ${grade1} (T1), ${grade2} (T2)`);
      }
    } else {
      console.log(`\n✅ Ya existen ${existingGrades[0].count} calificaciones`);
    }

    // 5. Crear asistencias si no existen
    const [existingAttendance] = await mysqlConn.execute(
      'SELECT COUNT(*) as count FROM asistencias WHERE id_estudiante = ?',
      [studentId]
    );

    if (existingAttendance[0].count === 0) {
      console.log('\n📅 Creando asistencias...');
      
      // Últimos 30 días
      for (let i = 0; i < 30; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const dateStr = fecha.toISOString().split('T')[0];
        
        // 90% presente, 10% falta/tardanza
        const rand = Math.random();
        let estado;
        if (rand < 0.90) estado = 'presente';
        else if (rand < 0.95) estado = 'tardanza';
        else estado = 'falta';

        await mysqlConn.execute(
          `INSERT INTO asistencias (id_estudiante, id_curso, fecha, estado) 
           VALUES (?, ?, ?, ?)`,
          [studentId, student.id_curso, dateStr, estado]
        );
      }
      
      console.log('   ✅ 30 registros de asistencia creados');
    } else {
      console.log(`\n✅ Ya existen ${existingAttendance[0].count} asistencias`);
    }

    // 6. Crear comportamiento si no existe
    const [existingBehavior] = await mysqlConn.execute(
      'SELECT COUNT(*) as count FROM comportamiento WHERE id_estudiante = ?',
      [studentId]
    );

    if (existingBehavior[0].count === 0) {
      console.log('\n🎯 Creando registros de comportamiento...');
      
      const behaviors = [
        { tipo: 'positivo', descripcion: 'Excelente participación en clase', puntos: 5 },
        { tipo: 'positivo', descripcion: 'Ayuda a compañeros', puntos: 3 },
        { tipo: 'positivo', descripcion: 'Cumple con tareas a tiempo', puntos: 4 },
        { tipo: 'neutral', descripcion: 'Conversaciones durante clase', puntos: 0 },
        { tipo: 'positivo', descripcion: 'Liderazgo en grupo', puntos: 5 }
      ];

      for (const behavior of behaviors) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 20));
        const dateStr = fecha.toISOString().split('T')[0];

        await mysqlConn.execute(
          `INSERT INTO comportamiento (id_estudiante, id_curso, fecha, tipo, descripcion, puntos) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [studentId, student.id_curso, dateStr, behavior.tipo, behavior.descripcion, behavior.puntos]
        );
        console.log(`   ✅ ${behavior.tipo}: ${behavior.descripcion} (+${behavior.puntos})`);
      }
    } else {
      console.log(`\n✅ Ya existen ${existingBehavior[0].count} registros de comportamiento`);
    }

    // 7. Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATOS CREADOS EXITOSAMENTE');
    console.log('='.repeat(50));
    console.log('\n💡 Ahora puedes generar el reporte de IA desde el frontend');
    console.log('   El reporte debería mostrar contenido en todas las secciones\n');

    await mysqlConn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createStudentData();
