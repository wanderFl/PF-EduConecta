import { Request, Response } from "express";
import { ceiafPool } from "../ext/ceiafDb";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

    // 1) Promedios en nuestra BD (SubmissionGrade) por materia del curso
    const grouped = await prisma.submissionGrade.groupBy({
      by: ["subject_external_id"],
      where: {
        course_external_id: courseId,
        grade: { not: null },
      },
      _avg: { grade: true },
    });

    // 2) Nombres de materias desde CEIAF para ese curso
    //    Tablas: docentemateriacurso (id_materia, id_curso) + materia (id_materia, nombre)
    const [subjectsRows] = await ceiafPool.query(`
      SELECT dmc.id_materia AS id_materia, m.nombre AS nombre
      FROM docente_materia_curso AS dmc
      JOIN materias AS m ON m.id_materia = dmc.id_materia
      WHERE dmc.id_curso = ?
      ORDER BY m.nombre ASC
    `, [courseId]);

    const subjects = (subjectsRows as any[]).map(r => ({
      id_materia: Number(r.id_materia),
      nombre: String(r.nombre),
    }));

    const nameById = new Map<number, string>(
      subjects.map(s => [s.id_materia, s.nombre])
    );

    // 3) Fusionar: promedio + nombre; incluir materias sin notas (avg = null)
    const items = grouped.map(g => {
      const sid = Number(g.subject_external_id);
      const avg = g._avg.grade ? Number(g._avg.grade) : null;
      return {
        subject_external_id: sid,
        subject_name: nameById.get(sid) ?? `Materia #${sid}`,
        avg,
      };
    });

    const missing = subjects
      .filter(s => !items.find(i => i.subject_external_id === s.id_materia))
      .map(s => ({
        subject_external_id: s.id_materia,
        subject_name: s.nombre,
        avg: null,
      }));

    const all = [...items, ...missing].sort((a, b) =>
      a.subject_name.localeCompare(b.subject_name)
    );

    return res.json({ course_id: courseId, items: all });
  } catch (e) {
    console.error("gradesBySubject error", e);
    return res.status(500).json({ error: "Error obteniendo promedios por materia" });
  }
};