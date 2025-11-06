import { Request, Response } from "express";
import { ceiafPool } from "../ext/ceiafDb";

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
