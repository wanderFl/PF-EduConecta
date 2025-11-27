"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verifyImplementation() {
    try {
        console.log('🔍 Verificando implementación del Dashboard de Agenda Escolar...\n');
        // 1. Verificar que las tareas existen en la base de datos
        const taskCount = await prisma.task.count();
        console.log(`📚 Tareas en base de datos: ${taskCount}`);
        if (taskCount === 0) {
            console.log('⚠️  No hay tareas en la base de datos. Ejecuta el script seed-tasks.ts primero.');
            return;
        }
        // 2. Verificar tareas con estadísticas
        const tasksWithSubmissions = await prisma.task.findMany({
            include: {
                submissions: true
            },
            take: 3
        });
        console.log('\n📋 Muestra de tareas con entregas:');
        tasksWithSubmissions.forEach((task, index) => {
            const submissionCount = task.submissions.length;
            const gradedCount = task.submissions.filter(s => s.grade !== null).length;
            const isOverdue = new Date(task.due_date) < new Date();
            console.log(`\n${index + 1}. ${task.title}`);
            console.log(`   📅 Vence: ${task.due_date.toLocaleDateString()}`);
            console.log(`   🏫 Curso: ${task.course_external_id}`);
            console.log(`   👨‍🏫 Docente: ${task.teacher_external_id}`);
            console.log(`   📄 Entregas: ${submissionCount}`);
            console.log(`   ✅ Calificadas: ${gradedCount}`);
            console.log(`   ⏰ Estado: ${isOverdue ? 'VENCIDA' : 'ACTIVA'}`);
        });
        // 3. Estadísticas generales
        const now = new Date();
        const overdueTasks = await prisma.task.count({
            where: {
                due_date: {
                    lt: now
                }
            }
        });
        const upcomingTasks = await prisma.task.count({
            where: {
                due_date: {
                    gte: now,
                    lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
                }
            }
        });
        const totalSubmissions = await prisma.submissionGrade.count();
        const gradedSubmissions = await prisma.submissionGrade.count({
            where: {
                grade: {
                    not: null
                }
            }
        });
        console.log('\n📊 Estadísticas del sistema:');
        console.log(`   📚 Total de tareas: ${taskCount}`);
        console.log(`   🔴 Tareas vencidas: ${overdueTasks}`);
        console.log(`   🟡 Próximas (7 días): ${upcomingTasks}`);
        console.log(`   📝 Total entregas: ${totalSubmissions}`);
        console.log(`   ✅ Entregas calificadas: ${gradedSubmissions}`);
        console.log(`   ⏳ Pendientes de calificar: ${totalSubmissions - gradedSubmissions}`);
        // 4. Verificar cursos únicos
        const uniqueCourses = await prisma.task.findMany({
            distinct: ['course_external_id'],
            select: {
                course_external_id: true
            }
        });
        // 5. Verificar docentes únicos
        const uniqueTeachers = await prisma.task.findMany({
            distinct: ['teacher_external_id'],
            select: {
                teacher_external_id: true
            }
        });
        console.log(`\n🏫 Cursos con tareas: ${uniqueCourses.map(c => c.course_external_id).join(', ')}`);
        console.log(`👨‍🏫 Docentes con tareas: ${uniqueTeachers.map(t => t.teacher_external_id).join(', ')}`);
        console.log('\n✅ Verificación completada exitosamente!');
        console.log('\n🚀 El Dashboard de Agenda Escolar está listo para usar.');
        console.log('💡 Accede a través del Dashboard del Docente -> "Agenda Escolar Digital"');
    }
    catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Ejecutar verificación
verifyImplementation();
