import { Request, Response } from "express";
import { ceiafPool, getTeacherSubjectById } from "../ext/ceiafDb";

export const getStudentName = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const [rows]: any = await ceiafPool.query(
      "SELECT nombres, apellidos FROM estudiantes WHERE id_estudiante = ? LIMIT 1",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Estudiante no encontrado" });

    const fullName = `${rows[0].nombres} ${rows[0].apellidos}`;
    res.json({ fullName });
  } catch (err) {
    res.status(500).json({ error: "Error consultando estudiante" });
  }
};

export const getTeacherName = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const [rows]: any = await ceiafPool.query(
      "SELECT nombres, apellidos FROM docentes WHERE id_docente = ? LIMIT 1",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Docente no encontrado" });

    const fullName = `${rows[0].nombres} ${rows[0].apellidos}`;
    res.json({ fullName });
  } catch (err) {
    res.status(500).json({ error: "Error consultando docente" });
  }
};

export const getTeacherSubject = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "id inválido" });

  try {
    const subject = await getTeacherSubjectById(id);
    return res.json({ subject }); // { subject: "Lengua y Literatura" } | { subject: null }
  } catch (e) {
    console.error("getTeacherSubject error", e);
    return res.status(500).json({ message: "Error consultando materia" });
  }
};

/**
 * Obtiene todos los estudiantes de un curso específico desde CEIAF.
 */
export async function getStudentsByCourseId(courseId: number) {
  const [rows] = await ceiafPool.query(
    `SELECT 
        id_estudiante,
        CONCAT(nombres, ' ', apellidos) AS nombre_completo
     FROM estudiantes
     WHERE id_curso = ?`,
    [courseId]
  );

  return rows as Array<{
    id_estudiante: number;
    nombre_completo: string;
  }>;
}