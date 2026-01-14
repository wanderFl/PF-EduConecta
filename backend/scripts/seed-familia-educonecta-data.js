/**
 * Script para crear datos de prueba SOLO para familia@educonecta.com
 * 
 * Este script crea:
 * - Tareas asignadas al curso del estudiante
 * - Entregas y calificaciones del estudiante
 * - Registros de asistencia
 * - Novedades disciplinarias
 * - Comunicados
 * 
 * Todo visible en Prisma Studio y listo para que la IA genere reportes
 * 
 * Ejecutar: node backend/scripts/seed-familia-educonecta-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

// Parsear DATABASE_CEIAF_URL
const ceiafUrl = process.env.DATABASE_CEIAF_URL;
if (!ceiafUrl) {
  console.error('❌ DATABASE_CEIAF_URL no está definida en .env');
  process.exit(1);
}

// mysql://user:password@host:port/database
const urlMatch = ceiafUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('❌ Formato de DATABASE_CEIAF_URL inválido');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

const mysqlConfig = {
  host,
  port: parseInt(port),
  user,
  password,
  database,
};

async function main() {
  console.log('🎯 Creando datos para familia@educonecta.com\n');

  const mysqlConn = await mysql.createConnection(mysqlConfig);

  try {
    // ==========================================
    // 1. BUSCAR USUARIO familia@educonecta.com
    // ==========================================
    console.log('🔍 Buscando usuario familia@educonecta.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'familia@educonecta.com' },
      include: { parent: true }
    });

    if (!user) {
      console.error('❌ Usuario familia@educonecta.com no encontrado');
      console.log('💡 Primero debes crear este usuario');
      return;
    }

    if (!user.parent_id || !user.parent) {
      console.error('❌ Usuario no tiene parent_id asociado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.email}`);
    console.log(`   Parent ID: ${user.parent_id}`);
    console.log(`   Parent Name: ${user.parent.full_name}\n`);

    // ==========================================
    // 2. OBTENER ESTUDIANTES VINCULADOS
    // ==========================================
    console.log('👨‍🎓 Obteniendo estudiantes vinculados...');
    
    const links = await prisma.parentStudentLink.findMany({
      where: { parent_id: user.parent_id }
    });

    if (links.length === 0) {
      console.error('❌ No hay estudiantes vinculados a este padre');
      return;
    }

    console.log(`✅ ${links.length} estudiante(s) vinculado(s)\n`);

    // ==========================================
    // 3. OBTENER DATOS DEL ESTUDIANTE DE MYSQL
    // ==========================================
    const estudianteId = parseInt(links[0].student_external_id);
    
    const [estudiantes] = await mysqlConn.query(`
      SELECT e.*, c.nombre as curso_nombre, c.paralelo, c.nivel
      FROM estudiantes e
      JOIN cursos c ON e.id_curso = c.id_curso
      WHERE e.id_estudiante = ?
    `, [estudianteId]);

    if (estudiantes.length === 0) {
      console.error('❌ Estudiante no encontrado en MySQL');
      return;
    }

    const estudiante = estudiantes[0];
    console.log('📚 Datos del estudiante:');
    console.log(`   Nombre: ${estudiante.nombres} ${estudiante.apellidos}`);
    console.log(`   Cédula: ${estudiante.cedula}`);
    console.log(`   Curso: ${estudiante.curso_nombre} - Paralelo ${estudiante.paralelo}`);
    console.log(`   Nivel: ${estudiante.nivel}\n`);

    // ==========================================
    // 4. OBTENER DOCENTES Y MATERIAS
    // ==========================================
    const [docentes] = await mysqlConn.query(`
      SELECT id_docente, nombres, apellidos, email 
      FROM docentes 
      LIMIT 5
    `);

    const [materiasRaw] = await mysqlConn.query(`
      SELECT id_materia, nombre as nombre_materia 
      FROM materias 
      LIMIT 5
    `);
    
    // Asignar un docente a cada materia
    const materias = materiasRaw.map((m, idx) => ({
      ...m,
      id_docente: docentes[idx % docentes.length].id_docente
    }));

    // Usar un ID genérico de inspector (ya que no existe tabla inspectores en MySQL)
    const inspectorId = '1';

    console.log(`📖 ${materias.length} materias disponibles`);
    console.log(`👨‍🏫 ${docentes.length} docentes disponibles\n`);

    // ==========================================
    // 5. LIMPIAR DATOS EXISTENTES
    // ==========================================
    console.log('🧹 Limpiando datos existentes del estudiante...');
    
    await prisma.message.deleteMany({
      where: {
        communication: {
          student_external_id: estudianteId
        }
      }
    });
    
    await prisma.communication.deleteMany({
      where: { student_external_id: estudianteId }
    });
    
    await prisma.disciplinaryReport.deleteMany({
      where: { student_external_id: estudianteId }
    });
    
    await prisma.attendanceRecord.deleteMany({
      where: { student_external_id: estudianteId }
    });
    
    await prisma.submissionGrade.deleteMany({
      where: { student_external_id: estudianteId }
    });
    
    await prisma.task.deleteMany({
      where: { course_external_id: estudiante.id_curso }
    });
    
    console.log('✅ Datos anteriores eliminados\n');

    // ==========================================
    // 6. CREAR TAREAS (PASADAS Y FUTURAS)
    // ==========================================
    console.log('📝 Creando tareas del curso...');
    
    const tareas = [];
    const tareasFuturas = [];
    
    // TAREAS PASADAS (con entregas completadas)
    const fechaBasePasada = new Date('2025-12-01');
    
    for (let i = 0; i < 20; i++) {
      const docente = docentes[i % docentes.length];
      const materia = materias[i % materias.length];
      const trimestre = (i % 3) + 1;
      const aporte = (i % 2) + 1;
      
      const fechaVencimiento = new Date(fechaBasePasada);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 5));

      const tarea = await prisma.task.create({
        data: {
          title: `${materia.nombre_materia} - Tarea ${i + 1}`,
          instructions: `Resolver los ejercicios ${i + 1} al ${i + 5}. Entregar con procedimiento completo y justificación de respuestas.`,
          due_date: fechaVencimiento,
          max_points: 10,
          teacher_external_id: docente.id_docente,
          course_external_id: estudiante.id_curso,
          subject_external_id: materia.id_materia,
          trimestre: trimestre,
          aporte: aporte,
        }
      });

      tareas.push(tarea);
      console.log(`  ✓ Tarea pasada ${i + 1}: ${tarea.title}`);
    }
    
    // TAREAS FUTURAS (pendientes - SIN entregas para recomendaciones de IA)
    console.log('\n📅 Creando tareas futuras pendientes...');
    const hoy = new Date('2026-01-11');
    
    const tareasFuturasData = [
      { materia_idx: 0, titulo: 'Ecuaciones de segundo grado', instrucciones: 'Resolver la guía de ejercicios sobre ecuaciones cuadráticas. Entregar procedimientos completos.', dias: 3, puntos: 10 },
      { materia_idx: 1, titulo: 'Ensayo sobre literatura ecuatoriana', instrucciones: 'Escribir un ensayo de 500 palabras sobre un autor ecuatoriano del siglo XX.', dias: 5, puntos: 10 },
      { materia_idx: 2, titulo: 'Present Perfect Tense - Exercises', instrucciones: 'Complete the workbook pages 45-48 about Present Perfect. Include examples.', dias: 7, puntos: 10 },
      { materia_idx: 0, titulo: 'Funciones trigonométricas', instrucciones: 'Resolver problemas de trigonometría básica y graficar funciones seno y coseno.', dias: 10, puntos: 15 },
      { materia_idx: 3, titulo: 'Informe de laboratorio - Reacciones químicas', instrucciones: 'Redactar informe completo del experimento de reacciones químicas realizado en clase.', dias: 12, puntos: 12 },
      { materia_idx: 4, titulo: 'Mapa conceptual: Historia del Ecuador', instrucciones: 'Crear un mapa conceptual sobre los principales acontecimientos de la historia ecuatoriana.', dias: 14, puntos: 10 },
      { materia_idx: 1, titulo: 'Análisis literario - Cuento', instrucciones: 'Analizar estructura narrativa, personajes y figuras literarias del cuento asignado.', dias: 18, puntos: 12 },
      { materia_idx: 2, titulo: 'Reading Comprehension Test', instrucciones: 'Read the assigned text and answer comprehension questions. Prepare vocabulary list.', dias: 21, puntos: 10 }
    ];
    
    for (let i = 0; i < tareasFuturasData.length; i++) {
      const data = tareasFuturasData[i];
      const materia = materias[data.materia_idx];
      
      const fechaVencimiento = new Date(hoy);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + data.dias);
      
      const tarea = await prisma.task.create({
        data: {
          title: data.titulo,
          instructions: data.instrucciones,
          due_date: fechaVencimiento,
          max_points: data.puntos,
          teacher_external_id: materia.id_docente,
          course_external_id: estudiante.id_curso,
          subject_external_id: materia.id_materia,
          trimestre: 1,
          aporte: 2,
        }
      });
      
      tareasFuturas.push(tarea);
      console.log(`  ✓ Tarea futura ${i + 1}: ${tarea.title} (vence en ${data.dias} días)`);
    }
    
    console.log(`\n✅ ${tareas.length} tareas pasadas creadas`);
    console.log(`✅ ${tareasFuturas.length} tareas futuras pendientes creadas (sin entregas)\n`);

    // ==========================================
    // 7. CREAR ENTREGAS Y CALIFICACIONES (SOLO TAREAS PASADAS)
    // ==========================================
    console.log('✍️ Creando entregas y calificaciones del estudiante...');
    
    let totalEntregas = 0;
    const calificaciones = [];
    
    for (let i = 0; i < tareas.length; i++) {
      const tarea = tareas[i];
      
      // 95% de las tareas pasadas están entregadas (solo 1 sin entregar)
      if (Math.random() > 0.05) {
        // Generar calificaciones variadas para análisis
        let nota;
        if (i < 5) {
          // Primeras tareas: notas bajas a medias (4-7)
          nota = 4 + Math.random() * 3;
        } else if (i < 12) {
          // Tareas intermedias: notas medias a buenas (6-9)
          nota = 6 + Math.random() * 3;
        } else {
          // Últimas tareas: notas buenas a excelentes (8-10)
          nota = 8 + Math.random() * 2;
        }
        
        const fechaEntrega = new Date(tarea.due_date);
        fechaEntrega.setDate(fechaEntrega.getDate() - Math.floor(Math.random() * 3));
        
        const submission = await prisma.submissionGrade.create({
          data: {
            task_id: tarea.id,
            student_external_id: estudianteId,
            grade: nota.toFixed(2),
            student_comment: Math.random() > 0.3 ? 'Tarea completada según las instrucciones' : null,
            teacher_comment: nota >= 9 ? 'Excelente trabajo' : 
                           nota >= 7 ? 'Buen trabajo, sigue así' : 
                           nota >= 5 ? 'Puede mejorar, revisar conceptos' : 
                           'Necesita refuerzo en estos temas',
            subject_external_id: tarea.subject_external_id,
            course_external_id: tarea.course_external_id,
            year: tarea.due_date.getFullYear(),
            month: tarea.due_date.getMonth() + 1,
            submitted_at: fechaEntrega,
            graded_at: new Date(),
          }
        });
        
        calificaciones.push({ materia: materias.find(m => m.id_materia === tarea.subject_external_id).nombre_materia, nota: parseFloat(nota.toFixed(2)) });
        totalEntregas++;
        console.log(`  ✓ Entrega ${totalEntregas}: ${tarea.title} - Nota: ${nota.toFixed(2)}/10`);
      } else {
        console.log(`  ⊗ Tarea ${i + 1} sin entregar`);
      }
    }
    
    const promedioGeneral = calificaciones.reduce((sum, c) => sum + c.nota, 0) / calificaciones.length;
    console.log(`\n✅ ${totalEntregas} entregas creadas`);
    console.log(`📊 Promedio general: ${promedioGeneral.toFixed(2)}/10\n`);

    // ==========================================
    // 7. CREAR REGISTROS DE ASISTENCIA
    // ==========================================
    console.log('📅 Creando registros de asistencia...');
    
    const fechaInicio = new Date('2026-01-06');
    const diasClase = 50; // ~10 semanas
    let diasPresente = 0;
    let diasAusente = 0;
    let diasJustificado = 0;

    for (let dia = 0; dia < diasClase; dia++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + dia);
      
      // Saltar fines de semana
      if (fecha.getDay() === 0 || fecha.getDay() === 6) continue;
      
      // Patrón de asistencia: 88% presente, 8% ausente injustificado, 4% justificado
      const random = Math.random();
      let status;
      let razon = null;
      
      if (random < 0.88) {
        status = 'PRESENT';
        diasPresente++;
      } else if (random < 0.96) {
        status = 'ABSENT_UNJUSTIFIED';
        diasAusente++;
      } else {
        status = 'ABSENT_JUSTIFIED_ACCEPTED';
        razon = 'Cita médica';
        diasJustificado++;
      }

      await prisma.attendanceRecord.create({
        data: {
          student_external_id: estudianteId,
          date: fecha,
          status: status,
          course_external_id: estudiante.id_curso,
          year: fecha.getFullYear(),
          month: fecha.getMonth() + 1,
          justification_reason: razon,
        }
      });
    }
    
    const totalDias = diasPresente + diasAusente + diasJustificado;
    const porcentajeAsistencia = (diasPresente / totalDias * 100).toFixed(1);
    
    console.log(`  ✓ ${diasPresente} días presente`);
    console.log(`  ✓ ${diasAusente} días ausente (injustificado)`);
    console.log(`  ✓ ${diasJustificado} días ausente (justificado)`);
    console.log(`\n✅ ${totalDias} registros de asistencia creados`);
    console.log(`📊 Asistencia: ${porcentajeAsistencia}%\n`);

    // ==========================================
    // 8. CREAR NOVEDADES DISCIPLINARIAS
    // ==========================================
    console.log('⚠️ Creando novedades disciplinarias...');
    
    const categorias = ['COMPORTAMIENTO', 'TAREA', 'ACADEMICO'];
    const severidades = ['LEVE', 'MODERADA'];
    
    const novedades = [
      {
        fecha: new Date('2026-01-10'),
        categoria: 'COMPORTAMIENTO',
        severidad: 'LEVE',
        titulo: 'Conversación en clase',
        descripcion: 'El estudiante fue observado conversando con compañeros durante la explicación del tema.'
      },
      {
        fecha: new Date('2026-01-15'),
        categoria: 'TAREA',
        severidad: 'LEVE',
        titulo: 'Tarea incompleta',
        descripcion: 'Entregó la tarea de matemáticas sin completar todos los ejercicios solicitados.'
      },
      {
        fecha: new Date('2026-01-20'),
        categoria: 'ACADEMICO',
        severidad: 'MODERADA',
        titulo: 'Bajo rendimiento en evaluación',
        descripcion: 'Obtuvo una calificación baja en la evaluación de ciencias naturales. Se recomienda refuerzo.'
      }
    ];

    for (let i = 0; i < novedades.length; i++) {
      const nov = novedades[i];
      await prisma.disciplinaryReport.create({
        data: {
          student_external_id: estudianteId,
          course_external_id: estudiante.id_curso,
          category: nov.categoria,
          severity: nov.severidad,
          title: nov.titulo,
          description: nov.descripcion,
          incident_date: nov.fecha,
          inspector_external_id: String(inspectorId),
        }
      });
      console.log(`  ✓ Novedad ${i + 1}: ${nov.titulo}`);
    }
    console.log(`\n✅ ${novedades.length} novedades creadas\n`);

    // ==========================================
    // 10. CREAR COMUNICADOS
    // ==========================================
    console.log('💬 Creando comunicados...');
    
    const comunicados = [
      {
        tipo: 'NOTICE',
        asunto: 'Recordatorio: Reunión de padres',
        mensaje: 'Estimados padres de familia, les recordamos que tenemos reunión el próximo viernes a las 15:00. Su asistencia es importante.'
      },
      {
        tipo: 'THREAD',
        asunto: null,
        mensaje: 'Buenos días, me comunico para informarle sobre el progreso académico de su hijo/a. Ha mostrado mejora en las últimas semanas.'
      },
      {
        tipo: 'NOTICE',
        asunto: 'Actividad extracurricular',
        mensaje: 'Les informamos sobre la actividad de ciencias que realizaremos la próxima semana. Se requiere autorización de los padres.'
      },
    ];

    for (let i = 0; i < comunicados.length; i++) {
      const com = comunicados[i];
      const docente = docentes[i % docentes.length];
      
      const comunicado = await prisma.communication.create({
        data: {
          kind: com.tipo,
          subject: com.asunto,
          student_external_id: estudianteId,
          teacher_external_id: docente.id_docente,
          parent_id: user.parent_id,
          status: 'OPEN',
          is_behavioral_note: false,
        }
      });

      await prisma.message.create({
        data: {
          communication_id: comunicado.id,
          body: com.mensaje,
          sender_role: 'TEACHER',
          sender_teacher_external_id: docente.id_docente,
        }
      });

      console.log(`  ✓ Comunicado ${i + 1}: ${com.asunto || 'Conversación'}`);
    }
    console.log(`\n✅ ${comunicados.length} comunicados creados\n`);

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DATOS CREADOS EXITOSAMENTE PARA familia@educonecta.com');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n👤 Usuario: familia@educonecta.com`);
    console.log(`👨‍🎓 Estudiante: ${estudiante.nombres} ${estudiante.apellidos}`);
    console.log(`📚 Curso: ${estudiante.curso_nombre} - Paralelo ${estudiante.paralelo}`);
    console.log('\n📊 Datos creados:');
    console.log(`  • ${tareas.length} tareas pasadas con entregas`);
    console.log(`  • ${tareasFuturas.length} tareas futuras pendientes (para recomendaciones)`);
    console.log(`  • ${totalEntregas} entregas con calificaciones`);
    console.log(`  • ${totalDias} registros de asistencia`);
    console.log(`  • ${novedades.length} novedades disciplinarias`);
    console.log(`  • ${comunicados.length} comunicados`);
    console.log('\n📈 Estadísticas:');
    console.log(`  • Promedio de calificaciones: ${promedioGeneral.toFixed(2)}/10`);
    console.log(`  • Tasa de asistencia: ${porcentajeAsistencia}%`);
    console.log(`  • Tasa de entrega: ${(totalEntregas/tareas.length*100).toFixed(1)}%`);
    console.log('\n📅 Tareas futuras pendientes:');
    tareasFuturas.forEach((t, i) => {
      const diasRestantes = Math.ceil((t.due_date - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`  ${i + 1}. ${t.title} (vence en ${diasRestantes} días)`);
    });
    console.log('\n🔍 Verificar en Prisma Studio:');
    console.log('   cd backend && npm run prisma:studio');
    console.log('\n🤖 Los datos están listos para generar reportes con IA:');
    console.log('   • Reporte de rendimiento: POST /api/ai/performance-report/1');
    console.log('   • Recomendaciones de tareas: POST /api/ai/task-recommendations/1');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mysqlConn.end();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
