const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLinks() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'familia@educonecta.com' },
      include: {
        parent: {
          include: {
            student_links: true
          }
        }
      }
    });

    console.log('👤 Usuario:', user?.email);
    console.log('🆔 User ID:', user?.id);
    console.log('👨‍👩‍👧 Parent ID:', user?.parent_id);
    
    if (user?.parent) {
      console.log('\n👥 Estudiantes vinculados:');
      if (user.parent.student_links.length === 0) {
        console.log('  ❌ No hay estudiantes vinculados');
      } else {
        user.parent.student_links.forEach(link => {
          console.log(`  - Student External ID: ${link.student_external_id}`);
        });
        
        // Get student details from CEIAF
        console.log('\n📚 Detalles de estudiantes:');
        for (const link of user.parent.student_links) {
          const student = await prisma.estudiante.findUnique({
            where: { id: parseInt(link.student_external_id) }
          });
          if (student) {
            console.log(`  - ID: ${student.id}, Nombre: ${student.nombre} ${student.apellido}`);
          } else {
            console.log(`  - ID: ${link.student_external_id} ❌ No encontrado en CEIAF`);
          }
        }
      }
    } else {
      console.log('❌ No hay registro de padre');
    }

    // Check available students
    console.log('\n📚 Estudiantes disponibles en CEIAF:');
    const students = await prisma.estudiante.findMany({
      take: 5
    });
    students.forEach(s => {
      console.log(`  - ID: ${s.id}, Nombre: ${s.nombre} ${s.apellido}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLinks();
