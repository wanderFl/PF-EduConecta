"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Script para probar el endpoint de creación de tareas
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function testTaskCreation() {
    try {
        console.log('🧪 Probando creación de tarea...');
        const testTask = await prisma.task.create({
            data: {
                title: 'Tarea de Prueba',
                instructions: 'Esta es una tarea de prueba',
                max_points: 100,
                due_date: new Date('2024-12-31'),
                teacher_external_id: 1,
                course_external_id: 1
            }
        });
        console.log('✅ Tarea creada exitosamente:', testTask);
        // Limpiar la tarea de prueba
        await prisma.task.delete({
            where: { id: testTask.id }
        });
        console.log('🧹 Tarea de prueba eliminada');
    }
    catch (error) {
        console.error('❌ Error en la prueba:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testTaskCreation();
