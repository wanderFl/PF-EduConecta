import mysql from 'mysql2/promise';
import 'dotenv/config';

const { DATABASE_CEIAF_URL } = process.env;

if (!DATABASE_CEIAF_URL) {
  console.warn('⚠️  DATABASE_CEIAF_URL no está definida en .env - algunas funcionalidades estarán limitadas');
}

/**
 * Crea un pool de conexiones a MySQL (Railway).
 * Configurado con SSL para compatibilidad con Railway.
 */
export const ceiafPool = DATABASE_CEIAF_URL ? mysql.createPool({
  uri: DATABASE_CEIAF_URL,
  ssl: { rejectUnauthorized: false }, // Railway requiere SSL
  waitForConnections: true,
  connectionLimit: 3, // Reducido para Railway free tier
  queueLimit: 0,
  connectTimeout: 15000, // 15 segundos de timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Manejar reconexiones automáticas
  maxIdle: 3, // Máximo de conexiones inactivas
  idleTimeout: 60000, // 60 segundos antes de cerrar conexión inactiva
}) : null as any;

/**
 * Wrapper para queries con reintentos automáticos en caso de pérdida de conexión
 */
export async function executeQuery(sql: string, params?: any[]): Promise<any> {
  if (!ceiafPool) {
    throw new Error('Conexión a base de datos MySQL no disponible');
  }

  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [rows] = await ceiafPool.query(sql, params);
      return rows;
    } catch (error: any) {
      lastError = error;
      
      // Si es error de conexión perdida, reintentar
      if (error.code === 'PROTOCOL_CONNECTION_LOST' && attempt < maxRetries) {
        console.warn(`⚠️ Conexión perdida, reintentando (${attempt}/${maxRetries})...`);
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // Si no es error de conexión o ya agotamos reintentos, lanzar error
      throw error;
    }
  }

  throw lastError;
}

/**
 * Obtiene el nombre de la materia "principal" de un docente.
 * Criterio: la asignación (docente_materia_curso) con ano_lectivo más reciente.
 */
export async function getTeacherSubjectById(teacherId: number): Promise<string | null> {
  if (!ceiafPool) {
    console.error('❌ ceiafPool is not available in getTeacherSubjectById');
    return null;
  }
  const rows = await executeQuery(
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
