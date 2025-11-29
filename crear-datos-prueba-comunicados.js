// Script simple: Crear conversaciones de prueba SIN consultar MySQL
// Usa IDs ficticios que ya deberían existir en la BD de CEIAF
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'backend', 'generated', 'prisma'));
const bcrypt = require(path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'));

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando datos de prueba para Comunicados\n');

  try {
    // 1. Crear/verificar usuario docente de prueba
    console.log('1️⃣ Configurando usuario docente de prueba...');
    
    const testEmail = 'docente.prueba@educonecta.com';
    const testPassword = 'docente123';
    const testTeacherId = '1'; // ID ficticio de docente en MySQL

    let teacher = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!teacher) {
      console.log('   Creando usuario docente...');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      teacher = await prisma.user.create({
        data: {
          email: testEmail,
          password_hash: hashedPassword,
          role: 'DOCENTE',
          external_id: testTeacherId,
          is_active: true,
          is_verified: true
        }
      });
      console.log('   ✅ Usuario creado');
    } else {
      console.log('   ✅ Usuario ya existe');
    }

    console.log(`   Email: ${teacher.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   External ID: ${teacher.external_id}`);

    // 2. Limpiar conversaciones antiguas
    console.log('\n2️⃣ Limpiando conversaciones antiguas...');
    const deleted = await prisma.conversation.deleteMany({
      where: {
        teacher_external_id: parseInt(teacher.external_id, 10)
      }
    });
    console.log(`   🗑️ Eliminadas ${deleted.count} conversaciones`);

    // 3. Crear conversaciones de prueba con IDs ficticios
    console.log('\n3️⃣ Creando conversaciones de prueba...\n');
    
    const testStudents = [
      { id: 1001, name: 'Juan Pérez', course: '1ro Básica A' },
      { id: 1002, name: 'María González', course: '1ro Básica A' },
      { id: 1003, name: 'Carlos Ramírez', course: '1ro Básica B' },
      { id: 1004, name: 'Ana Martínez', course: '2do Básica A' },
      { id: 1005, name: 'Luis Torres', course: '2do Básica B' },
    ];

    const subjects = [
      'Seguimiento académico',
      'Consulta sobre tareas',
      'Rendimiento en clase',
      'Asistencia y puntualidad',
      'Felicitaciones por buen desempeño'
    ];

    const teacherMessages = [
      'Estimado representante, me comunico para informarle sobre el progreso académico de su representado. Ha mostrado mejoras significativas en las últimas semanas.',
      'Hola, quisiera conversar sobre las tareas pendientes. Es importante que el estudiante mantenga al día sus actividades.',
      'Buenos días, quiero felicitar el esfuerzo de su representado. Ha demostrado dedicación y responsabilidad en clase.',
      'Le escribo para informarle sobre la asistencia. Por favor, es importante que el estudiante llegue puntualmente.',
      'Excelentes noticias. Su representado ha obtenido calificaciones sobresalientes este trimestre.'
    ];

    const parentMessages = [
      'Muchas gracias por la información, profesor. Seguiremos apoyando en casa.',
      'Entendido, estaremos más atentos con las tareas. Gracias por informarnos.',
      'Qué alegría escuchar eso. Seguiremos motivándolo.',
      'Disculpe las llegadas tarde, tomaremos medidas al respecto.',
      '¡Qué orgullo! Gracias por su dedicación como docente.'
    ];

    const teacherExtId = parseInt(teacher.external_id, 10);

    for (let i = 0; i < testStudents.length; i++) {
      const student = testStudents[i];
      
      // Crear conversación
      const conversation = await prisma.conversation.create({
        data: {
          kind: 'THREAD',
          student_external_id: student.id,
          teacher_external_id: teacherExtId,
          subject: `${subjects[i]} - ${student.name}`,
          is_behavioral_note: i === 3, // Una como nota de conducta
          archived_by_teacher: false,
          archived_by_parent: false,
        }
      });

      // Crear mensajes (2-4 por conversación)
      const numMessages = 2 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numMessages; j++) {
        const isTeacher = j % 2 === 0;
        await prisma.conversationMessage.create({
          data: {
            conversation_id: conversation.id,
            sender_role: isTeacher ? 'DOCENTE' : 'FAMILIA',
            sender_id: isTeacher ? teacher.external_id : `parent-${student.id}`,
            body: isTeacher ? teacherMessages[i] : parentMessages[i],
          }
        });
        
        // Pequeño delay para diferentes timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log(`   ✅ ${i + 1}. ${student.name} (${student.course}) - ${numMessages} mensajes`);
    }

    // 4. Verificar resultados
    console.log('\n4️⃣ Verificando conversaciones creadas...');
    const allConversations = await prisma.conversation.findMany({
      where: {
        teacher_external_id: teacherExtId
      },
      include: {
        conversation_messages: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    console.log(`\n✅ Total: ${allConversations.length} conversaciones`);
    allConversations.forEach((conv, i) => {
      const lastMsg = conv.conversation_messages[0];
      console.log(`   ${i + 1}. ${conv.subject}`);
      console.log(`      - ID: ${conv.id.substring(0, 8)}...`);
      console.log(`      - Última actualización: ${conv.updated_at.toLocaleString()}`);
      if (lastMsg) {
        console.log(`      - Último mensaje: ${lastMsg.body.substring(0, 50)}...`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ ¡TODO LISTO!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📌 Credenciales para probar:');
    console.log(`   Email:    ${teacher.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n🚀 Pasos siguientes:');
    console.log('   1. Presiona Ctrl+Shift+R en el navegador');
    console.log('   2. Ve a http://localhost:5173');
    console.log('   3. Inicia sesión con las credenciales de arriba');
    console.log('   4. Ve a "Comunicados" en el menú');
    console.log(`   5. Deberías ver ${allConversations.length} conversaciones\n`);
    console.log('⚠️  NOTA: Los estudiantes tienen IDs ficticios (1001-1005)');
    console.log('   Si estos IDs no existen en MySQL, verás "Estudiante no encontrado"');
    console.log('   pero las conversaciones SÍ aparecerán en la lista.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) console.error('   Código:', error.code);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
