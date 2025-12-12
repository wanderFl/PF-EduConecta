import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendNotification } from "../services/notificationSender";

const prisma = new PrismaClient();

// Tarea diaria a las 8:00 AM
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily reminder job...");
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Rango de 24 horas para "mañana"
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Buscar tareas que vencen mañana
    const tasksDueTomorrow = await prisma.task.findMany({
      where: {
        due_date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
      },
    });

    console.log(`Found ${tasksDueTomorrow.length} tasks due tomorrow.`);

    for (const task of tasksDueTomorrow) {
      // Buscar estudiantes del curso (usando la misma lógica aproximada de ParentStudentLink)
      // Nota: Esto es una aproximación. Lo ideal sería consultar MySQL para saber exactamente qué estudiantes están en el curso.
      // Aquí iteramos sobre todos los padres y verificamos si tienen hijos en ese curso (si tuviéramos esa info en Postgres).
      // Como no tenemos la info de curso en Postgres para el estudiante, usaremos una consulta cruda a MySQL si es posible,
      // o notificaremos a los padres que tengan hijos vinculados y haremos un filtro "best effort".
      
      // Para ser precisos, necesitamos los IDs de estudiantes del curso desde MySQL.
      // Importamos ceiafPool dinámicamente para evitar problemas de inicialización si no se usa.
      const { ceiafPool } = require('../ext/ceiafDb');
      
      try {
        const [students] = await ceiafPool.query(
          'SELECT id_estudiante FROM estudiantes WHERE id_curso = ?',
          [task.course_external_id]
        );

        if (Array.isArray(students)) {
          const studentIds = students.map((s: any) => s.id_estudiante);

          // Buscar entregas ya realizadas para excluir a esos estudiantes
          const submissions = await prisma.submissionGrade.findMany({
            where: {
              task_id: task.id,
              student_external_id: { in: studentIds },
            },
            select: { student_external_id: true },
          });

          const submittedStudentIds = new Set(submissions.map((s) => s.student_external_id));
          
          // Filtrar estudiantes que NO han entregado
          const pendingStudentIds = studentIds.filter((id) => !submittedStudentIds.has(id));

          if (pendingStudentIds.length > 0) {
             // Buscar padres de estos estudiantes pendientes
             const links = await prisma.parentStudentLink.findMany({
               where: { student_external_id: { in: pendingStudentIds.map(String) } },
               include: { parent: { include: { user: true } } }
             });

             for (const link of links) {
               if (link.parent?.user?.id) {
                 sendNotification(
                   link.parent.user.id,
                   "Recordatorio de Tarea",
                   `La tarea "${task.title}" vence mañana. ¡No olvides entregarla!`,
                   "TASK_REMINDER",
                   { taskId: task.id, dueDate: task.due_date }
                 );
               }
             }
          }
        }
      } catch (err) {
        console.error(`Error processing reminders for task ${task.id}:`, err);
      }
    }
  } catch (error) {
    console.error("Error in reminder job:", error);
  }
});
