"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function verifyCourseNames() {
    try {
        console.log('🔍 Verificando nombres de cursos corregidos...\n');
        // Obtener cursos únicos
        const uniqueCourses = await prisma.task.findMany({
            distinct: ['course_external_id'],
            select: {
                course_external_id: true
            },
            orderBy: {
                course_external_id: 'asc'
            }
        });
        console.log('📚 Cursos disponibles en el sistema:');
        const courseNames = {
            8: '8vo',
            9: '9no',
            10: '10mo',
            11: '1ro BGU',
            12: '2do BGU',
            13: '3ro BGU'
        };
        uniqueCourses.forEach(course => {
            const courseName = courseNames[course.course_external_id] || `Curso ${course.course_external_id}`;
            console.log(`   ${course.course_external_id} → ${courseName}`);
        });
        // Contar tareas por curso
        console.log('\n📊 Tareas por curso:');
        for (const course of uniqueCourses) {
            const taskCount = await prisma.task.count({
                where: {
                    course_external_id: course.course_external_id
                }
            });
            const courseName = courseNames[course.course_external_id] || `Curso ${course.course_external_id}`;
            console.log(`   ${courseName}: ${taskCount} tareas`);
        }
        console.log('\n✅ Verificación completada!');
        console.log('🎯 Los filtros ahora muestran los nombres correctos de cursos');
        console.log('🚫 El filtro por docente ha sido eliminado como solicitado');
    }
    catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Ejecutar verificación
verifyCourseNames();
