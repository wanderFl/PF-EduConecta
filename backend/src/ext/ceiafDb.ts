import mysql from 'mysql2/promise';
import 'dotenv/config';

const { DATABASE_CEIAF_URL } = process.env;

if (!DATABASE_CEIAF_URL) {
  console.warn('⚠️  DATABASE_CEIAF_URL no está definida en .env - algunas funcionalidades estarán limitadas');
}

/**
 * Crea un pool de conexiones a MySQL (Railway).
 * Si Railway exige SSL, descomenta la sección ssl.
 */
export const ceiafPool = DATABASE_CEIAF_URL ? mysql.createPool({
  uri: DATABASE_CEIAF_URL,
  // ssl: { rejectUnauthorized: true }, // <- habilítalo si te da error de SSL
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 10000, // 10 segundos de timeout
}) : null as any;
/**
 * Obtiene el nombre de la materia “principal” de un docente.
 * Criterio: la asignación (docente_materia_curso) con ano_lectivo más reciente.
 */
export async function getTeacherSubjectById(teacherId: number): Promise<string | null> {
  const [rows] = await ceiafPool.query(
    `
    SELECT m.nombre AS materia, dmc.ano_lectivo
    FROM docente_materia_curso dmc
    JOIN materias m ON m.id_materia = dmc.id_materia
    WHERE dmc.id_docente = ?
    ORDER BY 
      CASE 
        WHEN dmc.ano_lectivo REGEXP '^[0-9]{4}' THEN dmc.ano_lectivo 
        ELSE '0000-0000'
      END DESC
    LIMIT 1
    `,
    [teacherId]
  );
  const arr = rows as Array<{ materia: string | null }>;
  return arr.length ? (arr[0].materia ?? null) : null;
}

// Añade este helper:
export async function getStudentTeachersLikeName(
  studentId: number,
  q: string | null
): Promise<Array<{ teacher_id: number; teacher_name: string; subject: string }>> {
  // Filtramos por asignaciones del estudiante y opcionalmente por nombre
  // Ajusta nombres de columnas/joins a tu diagrama CEIAF.
  const like = q ? `%${q}%` : `%`;
  const [rows] = await ceiafPool.query(
    `
    SELECT DISTINCT d.id_docente AS teacher_id,
           CONCAT(d.nombres, ' ', d.apellidos) AS teacher_name,
           m.nombre AS subject
    FROM estudiantes e
    JOIN cursos c            ON c.id_curso = e.id_curso
    JOIN docente_materia_curso dmc ON dmc.id_curso = c.id_curso
    JOIN docentes d          ON d.id_docente = dmc.id_docente
    JOIN materias m          ON m.id_materia = dmc.id_materia
    WHERE e.id_estudiante = ?
      AND CONCAT(d.nombres, ' ', d.apellidos) LIKE ?
    ORDER BY teacher_name ASC
    LIMIT 50
    `,
    [studentId, like]
  );
  return rows as any;
}
