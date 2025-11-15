const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function seedParalelos() {
  try {
    console.log('🌱 Añadiendo paralelos a tareas existentes...');

    // Obtener tareas existentes
    const tasks = await prisma.task.findMany({
      where: {
        paralelo: null
      },
      take: 10
    });

    console.log(`📝 Encontradas ${tasks.length} tareas sin paralelo`);

    // Asignar paralelos de forma alternada
    const paralelos = ['A', 'B', 'C'];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const paralelo = paralelos[i % paralelos.length];
      
      await prisma.task.update({
        where: { id: task.id },
        data: { paralelo }
      });
      
      console.log(`✅ Tarea "${task.title}" actualizada con paralelo "${paralelo}"`);
    }

    // Crear algunas tareas nuevas con paralelos específicos
    const newTasks = [
      {
        title: 'Tarea Paralelo A - Matemáticas',
        course_external_id: 8,
        paralelo: 'A',
        teacher_external_id: 1,
        due_date: new Date('2024-12-01')
      },
      {
        title: 'Tarea Paralelo B - Historia',
        course_external_id: 8,
        paralelo: 'B',
        teacher_external_id: 1,
        due_date: new Date('2024-12-02')
      },
      {
        title: 'Tarea Paralelo C - Ciencias',
        course_external_id: 8,
        paralelo: 'C',
        teacher_external_id: 1,
        due_date: new Date('2024-12-03')
      }
    ];

    for (const taskData of newTasks) {
      await prisma.task.create({
        data: taskData
      });
      console.log(`➕ Creada tarea: ${taskData.title} (Paralelo ${taskData.paralelo})`);
    }

    console.log('✅ Seed de paralelos completado exitosamente!');
  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedParalelos();