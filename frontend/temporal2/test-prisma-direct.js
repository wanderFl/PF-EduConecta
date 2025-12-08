const { PrismaClient } = require('./backend/generated/prisma');

const prisma = new PrismaClient();

async function testCourseExternalId() {
  try {
    console.log('🧪 Testing course_external_id field directly in database...\n');

    // 1. Crear una tarea de prueba directamente en la base de datos
    console.log('1. Creating test task directly in database...');
    
    const testTask = await prisma.task.create({
      data: {
        title: 'PRUEBA DIRECTA - Verificar course_external_id',
        instructions: 'Esta tarea fue creada directamente con Prisma para verificar que el campo course_external_id se guarda correctamente.',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        max_points: 10,
        teacher_external_id: 1,
        course_external_id: 8, // Curso 8vo
        file_reference: null
      }
    });

    console.log('✅ Test task created successfully!');
    console.log('Task details:', {
      id: testTask.id,
      title: testTask.title,
      course_external_id: testTask.course_external_id,
      teacher_external_id: testTask.teacher_external_id,
      due_date: testTask.due_date,
      created_at: testTask.created_at
    });

    // 2. Verificar que se puede consultar por course_external_id
    console.log('\n2. Querying tasks by course_external_id...');
    
    const tasksByCourse = await prisma.task.findMany({
      where: {
        course_external_id: 8
      },
      select: {
        id: true,
        title: true,
        course_external_id: true,
        teacher_external_id: true,
        due_date: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`✅ Found ${tasksByCourse.length} tasks for course_external_id = 8:`);
    tasksByCourse.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (ID: ${task.id}, Course: ${task.course_external_id})`);
    });

    // 3. Crear tareas para diferentes cursos
    console.log('\n3. Creating tasks for multiple courses...');
    
    const coursesToTest = [9, 10, 11];
    
    for (const courseId of coursesToTest) {
      const courseTask = await prisma.task.create({
        data: {
          title: `Tarea para Curso ${courseId} - Verificación`,
          instructions: `Tarea de prueba para verificar course_external_id = ${courseId}`,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          max_points: 5,
          teacher_external_id: 1,
          course_external_id: courseId
        }
      });
      
      console.log(`   ✅ Created task for course ${courseId}: ${courseTask.id}`);
    }

    // 4. Mostrar resumen de todas las tareas por curso
    console.log('\n4. Summary of all tasks by course:');
    
    const allCourses = [8, 9, 10, 11];
    
    for (const courseId of allCourses) {
      const count = await prisma.task.count({
        where: { course_external_id: courseId }
      });
      console.log(`   Curso ${courseId}: ${count} tareas`);
    }

    console.log('\n🎯 VERIFICACIÓN EXITOSA:');
    console.log('✅ El campo course_external_id se está guardando correctamente');
    console.log('✅ Se pueden crear tareas para diferentes cursos');
    console.log('✅ Se pueden consultar tareas por course_external_id');
    console.log('\n📊 Abre Prisma Studio en http://localhost:5556 para ver los datos');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCourseExternalId();