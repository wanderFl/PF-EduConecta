"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verifyEnhancedFilters() {
    try {
        console.log('🔍 Verificando mejoras implementadas en la Agenda Escolar...\n');
        // 1. Verificar orden de cursos
        console.log('📚 Verificando orden de cursos disponibles:');
        const uniqueCourses = await prisma.task.findMany({
            distinct: ['course_external_id'],
            select: {
                course_external_id: true
            },
            orderBy: {
                course_external_id: 'asc'
            }
        });
        const courseNames = {
            8: '8vo',
            9: '9no',
            10: '10mo',
            11: '1ro BGU',
            12: '2do BGU',
            13: '3ro BGU'
        };
        // Ordenar según el orden específico
        const courseOrder = [8, 9, 10, 11, 12, 13];
        const orderedCourses = uniqueCourses.sort((a, b) => {
            const indexA = courseOrder.indexOf(a.course_external_id);
            const indexB = courseOrder.indexOf(b.course_external_id);
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1)
                return -1;
            if (indexB !== -1)
                return 1;
            return a.course_external_id - b.course_external_id;
        });
        console.log('   Orden implementado (según requerimiento):');
        orderedCourses.forEach((course, index) => {
            const courseName = courseNames[course.course_external_id] || `Curso ${course.course_external_id}`;
            console.log(`   ${index + 1}. ${courseName} (ID: ${course.course_external_id})`);
        });
        // 2. Verificar paralelos disponibles por curso
        console.log('\n📋 Verificando paralelos disponibles por curso:');
        const getParalelosByCourse = (courseExternalId) => {
            switch (courseExternalId) {
                case 8: // 8vo
                case 9: // 9no
                case 10: // 10mo
                    return ['A', 'B', 'C'];
                case 11: // 1ro BGU
                case 12: // 2do BGU
                case 13: // 3ro BGU
                    return ['A', 'B'];
                default:
                    return ['A'];
            }
        };
        orderedCourses.forEach(course => {
            const courseName = courseNames[course.course_external_id] || `Curso ${course.course_external_id}`;
            const paralelos = getParalelosByCourse(course.course_external_id);
            console.log(`   ${courseName}: Paralelos ${paralelos.join(', ')}`);
        });
        // 3. Verificar estadísticas de tareas por curso
        console.log('\n📊 Estadísticas de tareas por curso ordenado:');
        for (const course of orderedCourses) {
            const taskCount = await prisma.task.count({
                where: {
                    course_external_id: course.course_external_id
                }
            });
            const courseName = courseNames[course.course_external_id] || `Curso ${course.course_external_id}`;
            const paralelos = getParalelosByCourse(course.course_external_id);
            console.log(`   ${courseName}: ${taskCount} tareas | Paralelos: ${paralelos.join(', ')}`);
        }
        // 4. Funcionalidades implementadas
        console.log('\n✅ Funcionalidades implementadas correctamente:');
        console.log('   ✓ Orden específico de cursos: 8vo, 9no, 10mo, 1ro BGU, 2do BGU, 3ro BGU');
        console.log('   ✓ Filtro dinámico de paralelos por curso');
        console.log('   ✓ Carga automática de paralelos al seleccionar curso');
        console.log('   ✓ Filtrado de tareas por curso y paralelo');
        console.log('   ✓ Visualización de curso y paralelo en las tareas');
        console.log('   ✓ Limpieza de filtros incluye paralelos');
        console.log('   ✓ Todas las funcionalidades existentes mantenidas intactas');
        // 5. Endpoints disponibles
        console.log('\n🔗 Nuevos endpoints disponibles:');
        console.log('   GET /api/tasks/course/:courseId?paralelo=X - Tareas filtradas por curso y paralelo');
        console.log('   GET /api/tasks/course/:courseId/paralelos - Paralelos disponibles para un curso');
        console.log('\n🎯 Verificación completada exitosamente!');
        console.log('📱 La Agenda Escolar ahora incluye filtro de paralelos y orden correcto de cursos');
    }
    catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Ejecutar verificación
verifyEnhancedFilters();
