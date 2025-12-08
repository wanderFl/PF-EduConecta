// Script completo: Registrar docente y crear conversaciones de prueba
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'backend', 'generated', 'prisma'));
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));
const bcrypt = require(path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'));

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración completa de comunicados...\n');
  
  // Conexión a MySQL
  const ceiafPool = mysql.createPool({
    host: process.env.DB_HOST_CEIAF || 'junction.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT_CEIAF || '17950'),
    user: process.env.DB_USER_CEIAF || 'root',
    password: process.env.DB_PASSWORD_CEIAF || 'RCqGqGvlxhfUAKWaXCqOPCzHIPlcvJOr',
    database: process.env.DB_NAME_CEIAF || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    // 1. Buscar un docente en MySQL
    console.log('1️⃣ Buscando docentes en MySQL...');
    const [teachers] = await ceiafPool.query(`
      SELECT 
        d.id_docente,
        d.nombres,
        d.apellidos,
        d.cedula,
        d.correo
      FROM docentes d
      WHERE d.correo IS NOT NULL 
        AND d.correo != ''
      LIMIT 5
    `);

    if (!teachers || teachers.length === 0) {
      console.error('❌ No se encontraron docentes en MySQL');
      return;
    }

    console.log(`✅ Se encontraron ${teachers.length} docentes en MySQL:`);
    teachers.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.nombres} ${t.apellidos} (${t.correo})`);
    });

    const selectedTeacher = teachers[0];
    console.log(`\n📌 Seleccionado: ${selectedTeacher.nombres} ${selectedTeacher.apellidos}`);

    // 2. Verificar si ya existe en el sistema
    console.log('\n2️⃣ Verificando si el docente ya está registrado...');
    let teacher = await prisma.user.findFirst({
      where: {
        email: selectedTeacher.correo,
        role: 'DOCENTE'
      }
    });

    if (!teacher) {
      console.log('⚙️ Docente no registrado, creando usuario...');
      const password = 'docente123'; // Contraseña de prueba
      const hashedPassword = await bcrypt.hash(password, 10);

      teacher = await prisma.user.create({
        data: {
          email: selectedTeacher.correo,
          password_hash: hashedPassword,
          role: 'DOCENTE',
          external_id: selectedTeacher.id_docente.toString(),
          is_active: true,
          is_verified: true
        }
      });

      console.log('✅ Usuario docente creado:');
      console.log(`   - Email: ${teacher.email}`);
      console.log(`   - Password: ${password}`);
      console.log(`   - External ID: ${teacher.external_id}`);
    } else {
      console.log('✅ Docente ya está registrado:');
      console.log(`   - Email: ${teacher.email}`);
      console.log(`   - External ID: ${teacher.external_id}`);
    }

    const teacherExternalId = parseInt(teacher.external_id, 10);

    // 3. Buscar estudiantes del docente
    console.log('\n3️⃣ Buscando estudiantes del docente...');
    const [students] = await ceiafPool.query(`
      SELECT DISTINCT 
        e.id_estudiante,
        e.nombres,
        e.apellidos,
        e.cedula,
        c.nombre_curso,
        c.paralelo
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      INNER JOIN docente_materia_curso dmc ON c.id_curso = dmc.id_curso
      WHERE dmc.id_docente = ?
      LIMIT 10
    `, [teacherExternalId]);

    if (!students || students.length === 0) {
      console.error('❌ No se encontraron estudiantes para este docente');
      return;
    }

    console.log(`✅ Se encontraron ${students.length} estudiantes`);

    // 4. Limpiar conversaciones existentes (opcional)
    console.log('\n4️⃣ Limpiando conversaciones antiguas del docente...');
    const deleted = await prisma.conversation.deleteMany({
      where: {
        teacher_external_id: teacherExternalId
      }
    });
    console.log(`🗑️ Eliminadas ${deleted.count} conversaciones antiguas`);

    // 5. Crear conversaciones de prueba
    console.log('\n5️⃣ Creando conversaciones de prueba...\n');
    
    const conversationsToCreate = Math.min(5, students.length);
    const subjects = [
      'Seguimiento académico',
      'Consulta sobre tareas',
      'Rendimiento en clase',
      'Asistencia y puntualidad',
      'Felicitaciones por buen desempeño'
    ];

    const messages = [
      'Estimado representante, me comunico para informarle sobre el progreso de su representado.',
      'Hola, quisiera conversar sobre el rendimiento académico del estudiante.',
      'Buenos días, necesito hablar con usted sobre algunos detalles importantes.',
      'Le escribo para mantenerlo informado sobre la situación académica.',
      'Felicitaciones, su representado ha mostrado excelente desempeño.'
    ];

    for (let i = 0; i < conversationsToCreate; i++) {
      const student = students[i];
      
      const conversation = await prisma.conversation.create({
        data: {
          kind: 'THREAD',
          student_external_id: student.id_estudiante,
          teacher_external_id: teacherExternalId,
          subject: `${subjects[i]} - ${student.nombres} ${student.apellidos}`,
          is_behavioral_note: false,
          archived_by_teacher: false,
          archived_by_parent: false,
        }
      });

      // Crear 2-3 mensajes por conversación
      const numMessages = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < numMessages; j++) {
        await prisma.conversationMessage.create({
          data: {
            conversation_id: conversation.id,
            sender_role: j % 2 === 0 ? 'DOCENTE' : 'FAMILIA',
            sender_id: j % 2 === 0 ? teacher.external_id : 'parent-test',
            body: j % 2 === 0 ? messages[i] : 'Gracias por la información, estaremos atentos.',
          }
        });
      }

      console.log(`   ✅ Conversación ${i + 1}/${conversationsToCreate}: ${student.nombres} ${student.apellidos}`);
    }

    // 6. Verificar resultados
    console.log('\n6️⃣ Verificando conversaciones creadas...');
    const allConversations = await prisma.conversation.findMany({
      where: {
        teacher_external_id: teacherExternalId
      },
      include: {
        conversation_messages: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    console.log(`\n✅ Total: ${allConversations.length} conversaciones creadas`);
    allConversations.forEach((conv, i) => {
      console.log(`   ${i + 1}. ${conv.subject}`);
      console.log(`      - Mensajes: ${conv.conversation_messages.length}`);
      console.log(`      - Última actualización: ${conv.updated_at.toLocaleString()}`);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ ¡TODO LISTO! Configuración completada');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📌 Credenciales de acceso:');
    console.log(`   Email:    ${teacher.email}`);
    console.log(`   Password: docente123`);
    console.log('\n🚀 Pasos siguientes:');
    console.log('   1. Haz Ctrl+Shift+R en el navegador (limpiar caché)');
    console.log('   2. Ve a http://localhost:5173');
    console.log('   3. Inicia sesión con las credenciales de arriba');
    console.log('   4. Ve a la sección "Comunicados"');
    console.log(`   5. Deberías ver ${allConversations.length} conversaciones\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await ceiafPool.end();
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
