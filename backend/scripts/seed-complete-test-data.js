/**
 * Script para crear datos completos de prueba:
 * - Tareas creadas por docentes
 * - Entregas y calificaciones de estudiantes
 * - Asistencia de estudiantes
 * - Novedades disciplinarias
 * - Relación padre-estudiante
 * - Comunicados
 * 
 * Ejecutar: node backend/scripts/seed-complete-test-data.js
 */

const { PrismaClient } = require('../generated/prisma');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Configuración MySQL (ajustar según tu .env)
const mysqlConfig = {
  host: process.env.CEIAF_DB_HOST || 'localhost',
  port: parseInt(process.env.CEIAF_DB_PORT || '3306'),
  user: process.env.CEIAF_DB_USER || 'root',
  password: process.env.CEIAF_DB_PASSWORD || '',
  database: process.env.CEIAF_DB_NAME || 'ceiaf_db',
};

async function main() {
  console.log('🌱 Iniciando seed de datos completos...\n');

  // Conexión MySQL
  const mysqlConn = await mysql.createConnection(mysqlConfig);
  console.log('✅ Conectado a MySQL\n');

  try {
    // ==========================
    // 1. OBTENER DATOS DE MYSQL
    // ==========================
    console.log('📚 Obteniendo datos de MySQL...');
    
    // Obtener cursos
    const [cursos] = await mysqlConn.query(`
      SELECT id_curso, nombre, paralelo, nivel 
      FROM cursos 
      LIMIT 3
    `);
    console.log(`  ✓ ${cursos.length} cursos encontrados`);

    // Obtener estudiantes del primer curso
    const cursoId = cursos[0].id_curso;
    const [estudiantes] = await mysqlConn.query(`
      SELECT id_estudiante, nombres, apellidos, cedula 
      FROM estudiantes 
      WHERE id_curso = ? 
      LIMIT 10
    `, [cursoId]);
    console.log(`  ✓ ${estudiantes.length} estudiantes encontrados\n`);

    // Obtener docentes
    const [docentes] = await mysqlConn.query(`
      SELECT id_docente, nombres, apellidos, email 
      FROM docentes 
      LIMIT 3
    `);
    console.log(`  ✓ ${docentes.length} docentes encontrados\n`);

    // Obtener materias
    const [materias] = await mysqlConn.query(`
      SELECT id_materia, nombre_materia 
      FROM materias 
      LIMIT 5
    `);
    console.log(`  ✓ ${materias.length} materias encontradas\n`);

    // ==========================
    // 2. CREAR USUARIOS PADRE DE FAMILIA
    // ==========================
    console.log('👨‍👩‍👧 Creando usuarios padres de familia...');
    
    const padres = [];
    for (let i = 0; i < Math.min(5, estudiantes.length); i++) {
      const estudiante = estudiantes[i];
      const passwordHash = await bcrypt.hash('1234', 10);
      const pinHash = await bcrypt.hash('1234', 10);

      // Crear Parent
      const parent = await prisma.parent.create({
        data: {
          full_name: `Padre/Madre de ${estudiante.nombres}`,
          cedula: `09${String(i).padStart(8, '0')}`,
          home_address: `Calle Ejemplo ${i + 1}, Guayaquil`,
          work_place: `Empresa ${i + 1}`,
          security_pin_hash: pinHash,
        }
      });

      // Crear User para el padre
      await prisma.user.create({
        data: {
          email: `padre${i + 1}@test.com`,
          password_hash: passwordHash,
          role: 'FAMILIA',
          parent_id: parent.id,
          is_active: true,
          is_verified: true,
        }
      });

      // Vincular padre con estudiante
      await prisma.parentStudentLink.create({
        data: {
          parent_id: parent.id,
          student_external_id: estudiante.id_estudiante,
        }
      });

      padres.push({ parent, estudiante });
      console.log(`  ✓ Padre ${i + 1} creado y vinculado a ${estudiante.nombres} ${estudiante.apellidos}`);
    }
    console.log('');

    // ==========================
    // 3. CREAR TAREAS
    // ==========================
    console.log('📝 Creando tareas...');
    
    const tareas = [];
    const fechaBase = new Date('2026-01-01');
    
    for (let i = 0; i < 15; i++) {
      const docente = docentes[i % docentes.length];
      const materia = materias[i % materias.length];
      const trimestre = (i % 3) + 1;
      const aporte = (i % 2) + 1;
      
      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 7));

      const tarea = await prisma.task.create({
        data: {
          title: `Tarea ${i + 1}: ${materia.nombre_materia}`,
          instructions: `Realizar ejercicios del capítulo ${i + 1}. Entregar en formato PDF con desarrollo completo.`,
          due_date: fechaVencimiento,
          max_points: 10,
          teacher_external_id: docente.id_docente,
          course_external_id: cursoId,
          subject_external_id: materia.id_materia,
          trimestre: trimestre,
          aporte: aporte,
        }
      });

      tareas.push(tarea);
      console.log(`  ✓ Tarea ${i + 1} creada: ${tarea.title}`);
    }
    console.log('');

    // ==========================
    // 4. CREAR ENTREGAS Y CALIFICACIONES
    // ==========================
    console.log('✍️ Creando entregas y calificaciones...');
    
    let totalEntregas = 0;
    for (const tarea of tareas) {
      // 70-90% de estudiantes entregan cada tarea
      const numEntregas = Math.floor(estudiantes.length * (0.7 + Math.random() * 0.2));
      
      for (let i = 0; i < numEntregas; i++) {
        const estudiante = estudiantes[i];
        
        // Calificación aleatoria entre 5 y 10
        const nota = 5 + Math.random() * 5;
        
        await prisma.submissionGrade.create({
          data: {
            task_id: tarea.id,
            student_external_id: estudiante.id_estudiante,
            grade: nota.toFixed(2),
            student_comment: Math.random() > 0.5 ? 'Tarea completada según instrucciones' : null,
            teacher_comment: nota >= 7 ? 'Buen trabajo' : nota >= 5 ? 'Puede mejorar' : 'Necesita refuerzo',
            subject_external_id: tarea.subject_external_id,
            course_external_id: tarea.course_external_id,
            year: tarea.due_date.getFullYear(),
            month: tarea.due_date.getMonth() + 1,
            submitted_at: new Date(tarea.due_date.getTime() - 24 * 60 * 60 * 1000),
            graded_at: new Date(),
          }
        });
        
        totalEntregas++;
      }
    }
    console.log(`  ✓ ${totalEntregas} entregas y calificaciones creadas\n`);

    // ==========================
    // 5. CREAR REGISTROS DE ASISTENCIA
    // ==========================
    console.log('📅 Creando registros de asistencia...');
    
    const fechaInicio = new Date('2026-01-06');
    const diasLaborables = 40; // 8 semanas de clases
    let totalAsistencias = 0;

    for (const estudiante of estudiantes) {
      for (let dia = 0; dia < diasLaborables; dia++) {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fecha.getDate() + dia);
        
        // Saltar fines de semana
        if (fecha.getDay() === 0 || fecha.getDay() === 6) continue;
        
        // 85% asiste, 10% falta injustificada, 5% falta justificada
        const random = Math.random();
        let status;
        if (random < 0.85) status = 'PRESENT';
        else if (random < 0.95) status = 'ABSENT_UNJUSTIFIED';
        else status = 'ABSENT_JUSTIFIED_ACCEPTED';

        await prisma.attendanceRecord.create({
          data: {
            student_external_id: estudiante.id_estudiante,
            date: fecha,
            status: status,
            course_external_id: cursoId,
            year: fecha.getFullYear(),
            month: fecha.getMonth() + 1,
            justification_reason: status !== 'PRESENT' ? 'Razón médica' : null,
          }
        });
        
        totalAsistencias++;
      }
    }
    console.log(`  ✓ ${totalAsistencias} registros de asistencia creados\n`);

    // ==========================
    // 6. CREAR NOVEDADES DISCIPLINARIAS
    // ==========================
    console.log('⚠️ Creando novedades disciplinarias...');
    
    const categorias = ['COMPORTAMIENTO', 'TAREA', 'ASISTENCIA', 'ACADEMICO', 'OTRO'];
    const severidades = ['LEVE', 'MODERADA', 'GRAVE'];
    
    let totalNovedades = 0;
    for (let i = 0; i < estudiantes.length; i++) {
      // 30% de estudiantes tienen novedades
      if (Math.random() > 0.3) continue;
      
      const estudiante = estudiantes[i];
      const numNovedades = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numNovedades; j++) {
        const fechaNovedad = new Date(fechaInicio);
        fechaNovedad.setDate(fechaNovedad.getDate() + Math.floor(Math.random() * 30));
        
        await prisma.disciplinaryReport.create({
          data: {
            student_external_id: estudiante.id_estudiante,
            course_external_id: cursoId,
            paralelo: cursos[0].paralelo,
            category: categorias[Math.floor(Math.random() * categorias.length)],
            severity: severidades[Math.floor(Math.random() * severidades.length)],
            title: `Incidente ${j + 1} - ${estudiante.nombres}`,
            description: `Descripción detallada del incidente ocurrido el ${fechaNovedad.toLocaleDateString()}`,
            incident_date: fechaNovedad,
          }
        });
        
        totalNovedades++;
      }
    }
    console.log(`  ✓ ${totalNovedades} novedades disciplinarias creadas\n`);

    // ==========================
    // 7. CREAR COMUNICADOS
    // ==========================
    console.log('💬 Creando comunicados...');
    
    let totalComunicados = 0;
    for (const { parent, estudiante } of padres) {
      // 2-3 comunicados por estudiante
      const numComunicados = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numComunicados; i++) {
        const docente = docentes[i % docentes.length];
        const esNoticia = Math.random() > 0.5;
        
        const comunicado = await prisma.communication.create({
          data: {
            kind: esNoticia ? 'NOTICE' : 'THREAD',
            subject: esNoticia ? `Comunicado importante ${i + 1}` : null,
            student_external_id: estudiante.id_estudiante,
            teacher_external_id: docente.id_docente,
            parent_id: parent.id,
            status: 'OPEN',
            is_behavioral_note: Math.random() > 0.7,
          }
        });

        // Crear mensajes
        await prisma.message.create({
          data: {
            communication_id: comunicado.id,
            body: esNoticia 
              ? `Estimados padres de familia: Les informamos sobre ${comunicado.subject}`
              : `Hola, me comunico respecto al desempeño de ${estudiante.nombres}`,
            sender_role: 'TEACHER',
            sender_teacher_external_id: docente.id_docente,
          }
        });

        if (!esNoticia && Math.random() > 0.5) {
          // Respuesta del padre
          await prisma.message.create({
            data: {
              communication_id: comunicado.id,
              body: 'Gracias por la información, estaremos atentos',
              sender_role: 'PARENT',
              sender_parent_id: parent.id,
            }
          });
        }
        
        totalComunicados++;
      }
    }
    console.log(`  ✓ ${totalComunicados} comunicados creados\n`);

    // ==========================
    // RESUMEN
    // ==========================
    console.log('═══════════════════════════════════════');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Resumen:`);
    console.log(`  • ${padres.length} padres de familia creados`);
    console.log(`  • ${tareas.length} tareas creadas`);
    console.log(`  • ${totalEntregas} entregas y calificaciones`);
    console.log(`  • ${totalAsistencias} registros de asistencia`);
    console.log(`  • ${totalNovedades} novedades disciplinarias`);
    console.log(`  • ${totalComunicados} comunicados creados`);
    console.log('═══════════════════════════════════════\n');

    console.log('📝 Credenciales de prueba:');
    console.log('  Padres: padre1@test.com - padre5@test.com');
    console.log('  Password: 1234');
    console.log('  PIN: 1234\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await mysqlConn.end();
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
