// Script para crear una conversación de prueba en la base de datos
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'backend', 'generated', 'prisma'));
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Conectando a la base de datos MySQL...');
  
  // Conexión a MySQL para obtener datos reales
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
    // 1. Buscar un docente en la base de datos de usuarios
    console.log('\n1️⃣ Buscando un docente en el sistema...');
    const teacher = await prisma.user.findFirst({
      where: { 
        role: 'DOCENTE',
        external_id: { not: null }
      },
      select: {
        id: true,
        email: true,
        external_id: true
      }
    });

    if (!teacher || !teacher.external_id) {
      console.error('❌ No se encontró ningún docente con external_id en el sistema');
      console.log('💡 Primero debes registrar un docente en el sistema');
      return;
    }

    console.log('✅ Docente encontrado:');
    console.log(`   - ID: ${teacher.id}`);
    console.log(`   - Email: ${teacher.email}`);
    console.log(`   - External ID: ${teacher.external_id}`);

    const teacherExternalId = parseInt(teacher.external_id, 10);

    // 2. Buscar estudiantes del docente en MySQL
    console.log('\n2️⃣ Buscando estudiantes del docente en MySQL...');
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
      LIMIT 5
    `, [teacherExternalId]);

    if (!students || students.length === 0) {
      console.error('❌ No se encontraron estudiantes para este docente');
      console.log('💡 Verifica que el docente tenga estudiantes asignados en MySQL');
      return;
    }

    console.log(`✅ Se encontraron ${students.length} estudiantes`);
    students.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.nombres} ${s.apellidos} (${s.nombre_curso} ${s.paralelo})`);
    });

    // 3. Seleccionar el primer estudiante
    const student = students[0];
    console.log(`\n3️⃣ Seleccionado estudiante: ${student.nombres} ${student.apellidos}`);

    // 4. Crear la conversación
    console.log('\n4️⃣ Creando conversación de prueba...');
    const conversation = await prisma.conversation.create({
      data: {
        kind: 'THREAD',
        student_external_id: student.id_estudiante,
        teacher_external_id: teacherExternalId,
        parent_id: null, // Sin padre por ahora
        subject: `Seguimiento académico - ${student.nombres} ${student.apellidos}`,
        is_behavioral_note: false,
        archived_by_parent: false,
        archived_by_teacher: false,
      }
    });

    console.log('✅ Conversación creada:');
    console.log(`   - ID: ${conversation.id}`);
    console.log(`   - Estudiante: ${student.nombres} ${student.apellidos} (ID: ${student.id_estudiante})`);
    console.log(`   - Docente ID: ${teacherExternalId}`);
    console.log(`   - Asunto: ${conversation.subject}`);

    // 5. Crear algunos mensajes de prueba
    console.log('\n5️⃣ Creando mensajes de prueba...');
    
    const message1 = await prisma.conversationMessage.create({
      data: {
        conversation_id: conversation.id,
        sender_role: 'DOCENTE',
        sender_id: teacher.external_id,
        body: `Estimado representante, me comunico para informarle sobre el rendimiento de ${student.nombres} en las últimas semanas. El estudiante ha mostrado un buen desempeño en clase.`,
      }
    });

    console.log('✅ Mensaje 1 creado (Docente)');

    const message2 = await prisma.conversationMessage.create({
      data: {
        conversation_id: conversation.id,
        sender_role: 'FAMILIA',
        sender_id: 'parent-test-123', // ID ficticio de padre
        body: 'Muchas gracias por la información, profesor. Seguiremos apoyando a nuestro hijo en sus estudios.',
      }
    });

    console.log('✅ Mensaje 2 creado (Familia)');

    const message3 = await prisma.conversationMessage.create({
      data: {
        conversation_id: conversation.id,
        sender_role: 'DOCENTE',
        sender_id: teacher.external_id,
        body: 'Perfecto, cuento con su apoyo. Cualquier novedad me contacto nuevamente.',
      }
    });

    console.log('✅ Mensaje 3 creado (Docente)');

    // 6. Crear otra conversación adicional
    if (students.length > 1) {
      const student2 = students[1];
      console.log(`\n6️⃣ Creando segunda conversación con: ${student2.nombres} ${student2.apellidos}`);
      
      const conversation2 = await prisma.conversation.create({
        data: {
          kind: 'THREAD',
          student_external_id: student2.id_estudiante,
          teacher_external_id: teacherExternalId,
          subject: `Consulta sobre tareas - ${student2.nombres} ${student2.apellidos}`,
          is_behavioral_note: false,
        }
      });

      await prisma.conversationMessage.create({
        data: {
          conversation_id: conversation2.id,
          sender_role: 'DOCENTE',
          sender_id: teacher.external_id,
          body: 'Hola, quisiera recordarle sobre la tarea pendiente de matemáticas.',
        }
      });

      console.log('✅ Segunda conversación creada');
    }

    // 7. Verificar conversaciones creadas
    console.log('\n7️⃣ Verificando conversaciones en la base de datos...');
    const allConversations = await prisma.conversation.findMany({
      where: {
        teacher_external_id: teacherExternalId
      },
      include: {
        conversation_messages: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    console.log(`✅ Total de conversaciones para este docente: ${allConversations.length}`);
    allConversations.forEach((conv, i) => {
      console.log(`   ${i + 1}. ${conv.subject}`);
      console.log(`      - Mensajes: ${conv.conversation_messages.length > 0 ? 'Sí' : 'No'}`);
      console.log(`      - Creada: ${conv.created_at.toLocaleString()}`);
    });

    console.log('\n✅ ¡Conversaciones de prueba creadas exitosamente!');
    console.log('\n📌 Ahora puedes:');
    console.log(`   1. Iniciar sesión como: ${teacher.email}`);
    console.log('   2. Ir a la sección "Comunicados"');
    console.log('   3. Ver las conversaciones creadas');
    console.log('\n💡 Recuerda hacer Ctrl+Shift+R en el navegador para limpiar el caché');

  } catch (error) {
    console.error('❌ Error:', error.message);
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
