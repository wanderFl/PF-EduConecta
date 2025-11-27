"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testTaskCreation() {
    try {
        console.log('Conectando a la base de datos...');
        // Verificar conexión
        await prisma.$connect();
        console.log('✅ Conexión exitosa');
        // Intentar crear una tarea de prueba
        const testTask = await prisma.task.create({
            data: {
                title: "Tarea de Prueba",
                instructions: "Esta es una tarea de prueba",
                due_date: new Date("2025-11-10"),
                max_points: 100,
                teacher_external_id: 1,
                course_external_id: 8
            }
        });
        console.log('✅ Tarea creada exitosamente:', testTask);
        // Listar todas las tareas
        const allTasks = await prisma.task.findMany();
        console.log('📝 Todas las tareas:', allTasks);
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testTaskCreation();
