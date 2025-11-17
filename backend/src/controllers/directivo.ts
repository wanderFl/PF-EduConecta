import { Request, Response } from "express";
import { ceiafPool } from "../ext/ceiafDb";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import type { SubjectStudentsPayload, SubjectStudentRow, SubjectStudentsSummary, StudentTaskRow, StudentSubjectTasksPayload } from "../types";

/**
 * GET /api/directivo/courses
 * Lista cursos activos (o todos) desde CEIAF.
 */
export const listCourses = async (req: Request, res: Response) => {
  try {
    // Ajusta el SELECT según tu modelo real en CEIAF:
    // id_curso, nombre, nivel, paralelo, ano_lectivo
    const [rows] = await ceiafPool.query(`
      SELECT c.id_curso, c.nombre, c.nivel, c.paralelo, c.ano_lectivo
      FROM cursos c
      ORDER BY c.nivel, c.paralelo
    `);

    const courses = (rows as any[]).map(r => ({
      id_curso: r.id_curso,
      nombre: r.nombre,
      nivel: r.nivel,
      paralelo: r.paralelo,
      ano_lectivo: r.ano_lectivo,
      display_name: r.nombre ?? `${r.nivel ?? ""} ${r.paralelo ?? ""}`.trim()
    }));

    res.json({ courses });
  } catch (e) {
    console.error("listCourses error", e);
    res.status(500).json({ message: "Error listando cursos" });
  }
};

/**
 * GET /api/directivo/courses/:courseId/analytics/grades-by-subject
 * Promedio de calificaciones por materia del curso, con nombres reales desde CEIAF.
 */
export const gradesBySubject = async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    if (!Number.isFinite(courseId)) {
      return res.status(400).json({ error: "courseId inválido" });
    }

    // 1) ¿Cuántos estudiantes hay en el curso? (CEIAF)
    // Ajusta la consulta a tu modelo real:
    // Opción A (si estudiantes tiene id_curso):
    const [countRowsA]: any[] = await ceiafPool.query(
      `SELECT COUNT(*) AS n
       FROM estudiantes
       WHERE id_curso = ?`,
      [courseId]
    );
    let totalStudents = Number(countRowsA?.[0]?.n ?? 0);

    // Opción B (si usas tabla de matrículas alumno-curso):
    // const [countRowsB]: any[] = await ceiafPool.query(
    //   `SELECT COUNT(*) AS n
    //    FROM matriculas
    //    WHERE id_curso = ?`,
    //   [courseId]
    // );
    // let totalStudents = Number(countRowsB?.[0]?.n ?? 0);

    // 2) Lista de materias del curso (CEIAF)
    const [subjectsRows] = await ceiafPool.query(
      `
      SELECT dmc.id_materia AS id_materia, m.nombre AS nombre
      FROM docente_materia_curso AS dmc
      JOIN materias AS m ON m.id_materia = dmc.id_materia
      WHERE dmc.id_curso = ?
      ORDER BY m.nombre ASC
      `,
      [courseId]
    );

    const subjects = (subjectsRows as any[]).map(r => ({
      id_materia: Number(r.id_materia),
      nombre: String(r.nombre),
    }));

    const nameById = new Map<number, string>(
      subjects.map(s => [s.id_materia, s.nombre])
    );

    // 3) Promedios (en nuestra BD) por materia del curso
    const groupedAvg = await prisma.submissionGrade.groupBy({
      by: ["subject_external_id"],
      where: {
        course_external_id: courseId,
        grade: { not: null },
      },
      _avg: { grade: true },
      _count: { _all: true }, // opcional, por si quisieras
    });

    // Para calcular total_tasks y delivered_count por materia
    const subjectIds = subjects.map(s => s.id_materia);

    // 4) total_tasks por materia (tareas creadas de esa materia y curso)
    const tasksBySubject = await prisma.task.groupBy({
      by: ["subject_external_id"],
      where: {
        course_external_id: courseId,
        subject_external_id: { in: subjectIds },
      },
      _count: { _all: true },
    });
    const totalTasksBySubject = new Map<number, number>(
      tasksBySubject.map(t => [Number(t.subject_external_id), Number(t._count._all)])
    );

    // 5) delivered_count por materia (total de submissions registradas)
    //    OJO: contamos TODOS los registros en submissions_grades (entrega registrada)
    const deliveredBySubject = await prisma.submissionGrade.groupBy({
      by: ["subject_external_id"],
      where: {
        course_external_id: courseId,
        subject_external_id: { in: subjectIds },
        // si quieres contar sólo las que tengan archivo o comentario, ajusta aquí
        // file_reference: { not: null },
      },
      _count: { _all: true },
    });
    const deliveredCountBySubject = new Map<number, number>(
      deliveredBySubject.map(d => [Number(d.subject_external_id), Number(d._count._all)])
    );

    // 6) Armar respuesta por materia
    //    (unir nombre + promedio + totales + %)
    const avgBySubject = new Map<number, number | null>(
      groupedAvg.map(g => [Number(g.subject_external_id), g._avg.grade ? Number(g._avg.grade) : null])
    );

    const items = subjects.map(s => {
      const sid = s.id_materia;
      const avg = avgBySubject.get(sid) ?? null;
      const total_tasks = totalTasksBySubject.get(sid) ?? 0;
      const delivered_count = deliveredCountBySubject.get(sid) ?? 0;
      const expected_submissions = totalStudents * total_tasks;
      const delivered_pct =
        expected_submissions > 0 ? (delivered_count / expected_submissions) * 100 : 0;

      return {
        subject_external_id: sid,
        subject_name: s.nombre,
        avg,
        total_students: totalStudents,
        total_tasks,
        expected_submissions,
        delivered_count,
        delivered_pct,
      };
    });

    return res.json({ course_id: courseId, items });
  } catch (e) {
    console.error("gradesBySubject error", e);
    return res.status(500).json({ error: "Error obteniendo promedios por materia" });
  }
};

/**
 * GET /api/directivo/grades/subject/:courseId/:subjectId/students?q=nombre
 * Devuelve la tabla de rendimiento por estudiante para una materia del curso.
 * - avg individual por estudiante (sobre SubmissionGrade)
 * - entregas registradas
 * - tareas atrasadas: (tareas con due_date vencido y sin submission para ese estudiante)
 * - summary global
 */
export const subjectStudentsPerformance = async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    const subjectId = Number(req.params.subjectId);
    const q = (req.query.q ?? "").toString().trim().toLowerCase();

    if (!Number.isFinite(courseId) || !Number.isFinite(subjectId)) {
      return res.status(400).json({ error: "courseId o subjectId inválido" });
    }

    // 1) Estudiantes del curso (CEIAF)
    const [studentRows]: any[] = await ceiafPool.query(
      `SELECT id_estudiante, nombres, apellidos
       FROM estudiantes
       WHERE id_curso = ?`,
      [courseId]
    );
    let students: { id_estudiante: number; nombres: string; apellidos: string }[] =
      studentRows.map((r: any) => ({
        id_estudiante: Number(r.id_estudiante),
        nombres: String(r.nombres ?? ""),
        apellidos: String(r.apellidos ?? ""),
      }));

    // Filtro por nombre (opcional)
    if (q) {
      students = students.filter(s =>
        `${s.nombres} ${s.apellidos}`.toLowerCase().includes(q)
      );
    }

    // 2) Nombre de la materia (CEIAF)
    const [subjRows]: any[] = await ceiafPool.query(
      `SELECT nombre FROM materias WHERE id_materia = ? LIMIT 1`,
      [subjectId]
    );
    const subjectName = subjRows?.[0]?.nombre ?? `Materia #${subjectId}`;

    // 3) Tareas de esa materia en ese curso (en nuestra BD)
    const tasks = await prisma.task.findMany({
      where: {
        course_external_id: courseId,
        subject_external_id: subjectId,
      },
      select: { id: true, due_date: true },
    });
    const totalTasks = tasks.length;

    const now = new Date();
    const taskIds = tasks.map(t => t.id);
    const pastDueTaskIds = tasks.filter(t => t.due_date && t.due_date < now).map(t => t.id);
    const tasksPastDueCount = pastDueTaskIds.length;

    // 4) SubmissionGrades de esta materia/curso (todas)
    const submissions = await prisma.submissionGrade.findMany({
      where: {
        course_external_id: courseId,
        subject_external_id: subjectId,
      },
      select: {
        student_external_id: true,
        task_id: true,
        grade: true,
      },
    });

    // Índices por (student -> submissions, task->submissions)
    const subsByStudent = new Map<number, { task_id: string; grade: number | null }[]>();
    submissions.forEach(s => {
      const list = subsByStudent.get(s.student_external_id) ?? [];
      list.push({ task_id: s.task_id, grade: s.grade ? Number(s.grade) : null });
      subsByStudent.set(s.student_external_id, list);
    });

    // 5) Construir filas por estudiante
    const items: SubjectStudentRow[] = students.map(s => {
      const fullName = `${s.nombres} ${s.apellidos}`.trim();
      const subs = subsByStudent.get(s.id_estudiante) ?? [];

      // entregas registradas
      const delivered_count = subs.length;

      // promedio individual (sobre las que tienen grade)
      const graded = subs.map(x => x.grade).filter((g): g is number => typeof g === "number");
      const avg = graded.length ? (graded.reduce((a, b) => a + b, 0) / graded.length) : null;

      // tareas atrasadas = tareas vencidas sin submission
      const deliveredTaskSet = new Set(subs.map(x => x.task_id));
      let late_count = 0;
      for (const tId of pastDueTaskIds) {
        if (!deliveredTaskSet.has(tId)) late_count++;
      }

      return {
        student_id: s.id_estudiante,
        student_name: fullName,
        avg,
        delivered_count,
        late_count,
      };
    });

    // 6) Summary
    const total_students = students.length;
    const total_expected_submissions = total_students * totalTasks;
    const total_delivered = items.reduce((acc, r) => acc + r.delivered_count, 0);
    const overall_delivered_pct =
      total_expected_submissions > 0 ? (total_delivered / total_expected_submissions) * 100 : 0;

    const total_late = items.reduce((acc, r) => acc + r.late_count, 0);
    const denomLate = total_students * tasksPastDueCount;
    const late_pct_over_past_due = denomLate > 0 ? (total_late / denomLate) * 100 : 0;

    const low_performance_count = items.reduce((acc, r) => acc + ((r.avg ?? 10) < 7 ? 1 : 0), 0);

    const summary: SubjectStudentsSummary = {
      total_students,
      total_tasks: totalTasks,
      total_expected_submissions,
      total_delivered,
      overall_delivered_pct,
      total_late,
      late_pct_over_past_due,
      low_performance_count,
    };

    const payload: SubjectStudentsPayload = {
      course_id: courseId,
      subject_id: subjectId,
      subject_name: subjectName,
      items,
      summary,
    };

    return res.json(payload);
  } catch (e) {
    console.error("subjectStudentsPerformance error", e);
    return res.status(500).json({ error: "Error obteniendo rendimiento individual" });
  }
};

/**
 * GET /api/directivo/courses/:courseId/subject/:subjectId/students/:studentId/tasks
 *
 * Devuelve todas las tareas de un estudiante en una materia:
 * - nombre de la tarea
 * - fecha de entrega
 * - fecha de envío
 * - calificación
 * - estado (Entregada, No entregada, Entregada tarde)
 * Ordenadas por trimestre, aporte y fecha de entrega.
 */
export const studentSubjectTasks = async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    const subjectId = Number(req.params.subjectId);
    const studentId = Number(req.params.studentId);

    if (
      !Number.isFinite(courseId) ||
      !Number.isFinite(subjectId) ||
      !Number.isFinite(studentId)
    ) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }

    // 1) Traer nombre del estudiante desde CEIAF
    const [studentRows]: any[] = await ceiafPool.query(
      `SELECT id_estudiante, nombres, apellidos
       FROM estudiantes
       WHERE id_estudiante = ?
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const studentName = `${studentRows[0].nombres ?? ""} ${
      studentRows[0].apellidos ?? ""
    }`.trim();

    // 2) Nombre de la materia
    const [subjRows]: any[] = await ceiafPool.query(
      `SELECT nombre FROM materias WHERE id_materia = ? LIMIT 1`,
      [subjectId]
    );
    const subjectName = subjRows?.[0]?.nombre ?? `Materia #${subjectId}`;

    // 3) Todas las tareas de esa materia + curso
    const tasks = await prisma.task.findMany({
      where: {
        course_external_id: courseId,
        subject_external_id: subjectId,
      },
      orderBy: [
        { trimestre: "asc" },
        { aporte: "asc" },
        { due_date: "asc" },
      ],
    });

    const taskIds = tasks.map((t) => t.id);

    // 4) Submissions del estudiante para esas tareas
    const submissions = await prisma.submissionGrade.findMany({
      where: {
        course_external_id: courseId,
        subject_external_id: subjectId,
        student_external_id: studentId,
        task_id: { in: taskIds },
      },
    });

    const subsByTaskId = new Map<string, (typeof submissions)[number]>();
    submissions.forEach((s) => subsByTaskId.set(s.task_id, s));

    // 5) Construir filas
    const items: StudentTaskRow[] = tasks.map((t) => {
      const sub = subsByTaskId.get(t.id) ?? null;

      const dueDate = t.due_date;
      const submittedAt = sub?.submitted_at ?? null;

      let status: StudentTaskRow["status"] = "NO_ENTREGADA";

      if (submittedAt) {
        if (submittedAt <= dueDate) {
          status = "ENTREGADA";
        } else {
          status = "ENTREGADA_TARDE";
        }
      }

      return {
        task_id: t.id,
        title: t.title,
        due_date: dueDate,
        submitted_at: submittedAt,
        grade: sub?.grade ? Number(sub.grade) : null,
        trimestre: t.trimestre ?? null,
        aporte: t.aporte ?? null,
        status,
        // 👇 NUEVO
        instructions: t.instructions ?? null,
        file_url: sub?.file_reference ?? null, // aquí va la URL que guardas en Postgres
      };
    });

    const payload: StudentSubjectTasksPayload = {
      course_id: courseId,
      subject_id: subjectId,
      subject_name: subjectName,
      student_id: studentId,
      student_name: studentName,
      items,
    };

    return res.json(payload);
  } catch (e) {
    console.error("studentSubjectTasks error", e);
    return res.status(500).json({ error: "Error obteniendo tareas del estudiante" });
  }
};