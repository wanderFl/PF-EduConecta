import { PrismaClient } from '../../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface TaskWithDetails {
  id: string;
  title: string;
  instructions: string | null;
  due_date: Date;
  max_points: number | null;
  file_reference: string | null;
  teacher_external_id: number;
  course_external_id: number;
  created_at: Date;
  updated_at: Date;
  submissions?: SubmissionGradeDetails[];
  submission_count?: number;
  graded_count?: number;
}

export interface SubmissionGradeDetails {
  id: string;
  student_external_id: number;
  grade: Decimal | null;
  file_reference: string | null;
  comment_student: string | null;
  comment_teacher: string | null;
  submitted_at: Date | null;
  graded_at: Date | null;
}

// Obtener todas las tareas
export async function getAllTasks(): Promise<TaskWithDetails[]> {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        submissions: true
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    return tasks.map(task => ({
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    }));
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    throw new Error('Error al obtener las tareas');
  }
}

// Obtener tareas por curso
export async function getTasksByCourse(courseExternalId: number): Promise<TaskWithDetails[]> {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        course_external_id: courseExternalId
      },
      include: {
        submissions: true
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    return tasks.map(task => ({
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    }));
  } catch (error) {
    console.error('Error fetching tasks by course:', error);
    throw new Error('Error al obtener las tareas del curso');
  }
}

// Obtener tareas por curso y paralelo
export async function getTasksByCourseAndParalelo(courseExternalId: number, paralelo?: string): Promise<TaskWithDetails[]> {
  try {
    // Si no se especifica paralelo, obtener todas las tareas del curso
    if (!paralelo) {
      return getTasksByCourse(courseExternalId);
    }

    // Filtrar por curso y paralelo específico
    const tasks = await prisma.task.findMany({
      where: {
        course_external_id: courseExternalId,
        paralelo: paralelo
      },
      include: {
        submissions: true
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    return tasks.map(task => ({
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    }));
  } catch (error) {
    console.error('Error fetching tasks by course and paralelo:', error);
    throw new Error('Error al obtener las tareas del curso y paralelo');
  }
}

// Obtener tareas por docente
export async function getTasksByTeacher(teacherExternalId: number): Promise<TaskWithDetails[]> {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        teacher_external_id: teacherExternalId
      },
      include: {
        submissions: true
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    return tasks.map(task => ({
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    }));
  } catch (error) {
    console.error('Error fetching tasks by teacher:', error);
    throw new Error('Error al obtener las tareas del docente');
  }
}

// Obtener una tarea específica con detalles
export async function getTaskById(taskId: string): Promise<TaskWithDetails | null> {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId
      },
      include: {
        submissions: true
      }
    });

    if (!task) {
      return null;
    }

    return {
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    };
  } catch (error) {
    console.error('Error fetching task by id:', error);
    throw new Error('Error al obtener la tarea');
  }
}

// Crear nueva tarea
export async function createTask(taskData: {
  title: string;
  instructions?: string;
  due_date: Date;
  max_points?: number;
  file_reference?: string;
  teacher_external_id: number;
  course_external_id: number;
  paralelo?: string;
}): Promise<TaskWithDetails> {
  try {
    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        instructions: taskData.instructions || null,
        due_date: taskData.due_date,
        max_points: taskData.max_points || null,
        file_reference: taskData.file_reference || null,
        teacher_external_id: taskData.teacher_external_id,
        course_external_id: taskData.course_external_id,
        paralelo: taskData.paralelo || null
      },
      include: {
        submissions: true
      }
    });

    return {
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Error al crear la tarea');
  }
}

// Actualizar tarea
export async function updateTask(
  taskId: string, 
  taskData: Partial<{
    title: string;
    instructions: string;
    due_date: Date;
    max_points: number;
    file_reference: string;
  }>
): Promise<TaskWithDetails | null> {
  try {
    const task = await prisma.task.update({
      where: {
        id: taskId
      },
      data: {
        ...taskData,
        updated_at: new Date()
      },
      include: {
        submissions: true
      }
    });

    return {
      ...task,
      submission_count: task.submissions.length,
      graded_count: task.submissions.filter(s => s.grade !== null).length
    };
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Error al actualizar la tarea');
  }
}

// Eliminar tarea
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    await prisma.task.delete({
      where: {
        id: taskId
      }
    });
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Error al eliminar la tarea');
  }
}

// Obtener paralelos disponibles para un curso desde la base de datos
export async function getParalelosByCourse(courseExternalId: number): Promise<string[]> {
  try {
    // Obtener paralelos únicos de las tareas existentes para este curso
    const tasks = await prisma.task.findMany({
      where: {
        course_external_id: courseExternalId,
        paralelo: {
          not: null
        }
      },
      select: {
        paralelo: true
      },
      distinct: ['paralelo']
    });

    const paralelosFromTasks = tasks
      .map(task => task.paralelo)
      .filter((paralelo): paralelo is string => paralelo !== null);

    // Si no hay paralelos en tareas, devolver paralelos típicos basados en el curso
    if (paralelosFromTasks.length === 0) {
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
    }

    // Ordenar paralelos alfabéticamente
    return paralelosFromTasks.sort();
  } catch (error) {
    console.error('Error fetching paralelos by course:', error);
    throw new Error('Error al obtener paralelos del curso');
  }
}

// Obtener estadísticas de tareas
export async function getTasksStats(filters?: {
  teacher_external_id?: number;
  course_external_id?: number;
  start_date?: Date;
  end_date?: Date;
}) {
  try {
    const whereClause: any = {};
    
    if (filters?.teacher_external_id) {
      whereClause.teacher_external_id = filters.teacher_external_id;
    }
    
    if (filters?.course_external_id) {
      whereClause.course_external_id = filters.course_external_id;
    }
    
    if (filters?.start_date || filters?.end_date) {
      whereClause.due_date = {};
      if (filters.start_date) {
        whereClause.due_date.gte = filters.start_date;
      }
      if (filters.end_date) {
        whereClause.due_date.lte = filters.end_date;
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        submissions: true
      }
    });

    const now = new Date();
    const overdueTasks = tasks.filter(task => task.due_date < now);
    const upcomingTasks = tasks.filter(task => {
      const daysUntilDue = Math.ceil((task.due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    const totalSubmissions = tasks.reduce((sum, task) => sum + task.submissions.length, 0);
    const totalGradedSubmissions = tasks.reduce((sum, task) => 
      sum + task.submissions.filter(s => s.grade !== null).length, 0
    );

    return {
      total_tasks: tasks.length,
      overdue_tasks: overdueTasks.length,
      upcoming_tasks: upcomingTasks.length,
      total_submissions: totalSubmissions,
      total_graded_submissions: totalGradedSubmissions,
      pending_grading: totalSubmissions - totalGradedSubmissions
    };
  } catch (error) {
    console.error('Error getting tasks stats:', error);
    throw new Error('Error al obtener estadísticas de tareas');
  }
}