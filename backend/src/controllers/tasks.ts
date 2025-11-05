import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ceiafPool } from '../ext/ceiafDb';

const prisma = new PrismaClient();

/**
 * Seguridad: verifica que el studentId esté vinculado a este padre.
 * Retorna el parent_id del usuario y el id_curso del estudiante en CEIAF.
 */
async function ensureParentOwnsStudentAndGetCourse(userId: string, studentId: number) {
  // 1) Obtener user -> parent_id
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.parent_id) throw new Error('NO_PARENT');

  // 2) ¿El vínculo existe?
  const link = await prisma.parentStudentLink.findUnique({
    where: { parent_id_student_external_id: { parent_id: user.parent_id, student_external_id: String(studentId) } }
  });
  if (!link) throw new Error('NOT_LINKED');

  // 3) Consultar id_curso del estudiante en CEIAF
  const [rows] = await ceiafPool.query(
    `SELECT id_estudiante, id_curso FROM estudiantes WHERE id_estudiante = ? LIMIT 1`,
    [studentId]
  );
  const arr = Array.isArray(rows) ? rows as Array<{ id_estudiante: number; id_curso: number | null; }> : [];
  if (arr.length === 0) throw new Error('STUDENT_NOT_FOUND');

  return { parentId: user.parent_id, idCurso: arr[0].id_curso ?? null };
}

/**
 * GET /api/familia/tareas?studentId=123[&from=YYYY-MM-DD][&to=YYYY-MM-DD]
 * Devuelve las tareas asignadas al curso del estudiante, y marca si el estudiante ya entregó.
 * - Si from/to no se envían, devuelve TODO (luego podrás usar el weekly en el front).
 */
/**
 * POST /api/familia/tareas
 * Body: { studentId: number, from?: string(YYYY-MM-DD), to?: string(YYYY-MM-DD) }
 */
export const getStudentTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { studentId: studentIdRaw, from, to } = req.body as {
      studentId?: number | string;
      from?: string;
      to?: string;
    };

    if (!userId) return res.status(401).json({ message: 'No autorizado' });
    const studentId = Number(studentIdRaw);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ message: 'studentId inválido' });
    }

    const { idCurso } = await ensureParentOwnsStudentAndGetCourse(userId, studentId);
    if (!idCurso) return res.json([]);

    const dateWhere =
      from || to
        ? {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          }
        : undefined;

    const tasks = await prisma.task.findMany({
      where: {
        course_external_id: idCurso,
        ...(dateWhere ? { due_date: dateWhere } : {}),
      },
      orderBy: { due_date: 'asc' },
    });

    if (tasks.length === 0) return res.json([]);

    const submissions = await prisma.submissionGrade.findMany({
      where: { task_id: { in: tasks.map(t => t.id) }, student_external_id: studentId },
      select: { id: true, task_id: true, grade: true, file_reference: true },
    });

    const subByTask = new Map<string, { id: string; grade: any; file_reference: string | null }>();
    submissions.forEach(s => subByTask.set(s.task_id, s));

    const result = tasks.map(t => {
      const sub = subByTask.get(t.id);
      return {
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        teacher_external_id: t.teacher_external_id,
        course_external_id: t.course_external_id,
        instructions: t.instructions ?? null,
        status: sub ? 'SUBMITTED' : 'PENDING',
        grade: sub?.grade ?? null,
        submission_file: sub?.file_reference ?? null,
      };
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_PARENT')  return res.status(400).json({ message: 'Tu usuario no está asociado a un perfil de padre' });
      if (error.message === 'NOT_LINKED')  return res.status(403).json({ message: 'Este estudiante no está vinculado a tu cuenta' });
      if (error.message === 'STUDENT_NOT_FOUND') return res.status(404).json({ message: 'Estudiante no encontrado en el sistema académico' });
    }
    console.error('POST /familia/tareas error:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
