import { ceiafPool } from '../ext/ceiafDb';

export interface Student {
  id: number;
  nombre_completo: string;
  cedula?: string;
  curso_nombre?: string;
  nivel?: string;
  paralelo?: string;
  fecha_nacimiento?: string;
  email?: string;
  telefono?: string;
  genero?: string;
}

export interface CourseStudents {
  course: string;
  students: Student[];
}

/**
 * Obtiene todos los estudiantes de un curso específico
 */
export async function getStudentsByCourse(courseId: string): Promise<Student[]> {
  try {
    // Si el courseId es numérico, usar directamente el id_curso
    const numericCourseId = parseInt(courseId);
    
    if (!isNaN(numericCourseId)) {
      // Consulta directa por id_curso (más precisa)
      const [rows] = await ceiafPool.query(`
        SELECT 
          e.id_estudiante as id,
          CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
          e.cedula,
          c.nombre as curso_nombre,
          c.nivel,
          c.paralelo,
          e.fecha_nacimiento,
          e.email,
          e.telefono,
          e.genero
        FROM estudiantes e
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        WHERE c.id_curso = ?
        ORDER BY e.nombres, e.apellidos
      `, [numericCourseId]);

      return rows as Student[];
    }

    // Mantener compatibilidad con el sistema anterior (mapeo por string)
    const courseMapping: { [key: string]: string } = {
      '8vo': 'Octavo EGB',
      '9no': 'Noveno EGB', 
      '10mo': 'Décimo EGB',
      '1bgu': 'Primero BGU',
      '2bgu': 'Segundo BGU',
      '3bgu': 'Tercero BGU'
    };

    const courseName = courseMapping[courseId];
    if (!courseName) {
      throw new Error(`Curso no encontrado: ${courseId}`);
    }
    
    // Consulta con JOIN para obtener información completa (sistema anterior)
    const [rows] = await ceiafPool.query(`
      SELECT 
        e.id_estudiante as id,
        CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
        e.cedula,
        c.nombre as curso_nombre,
        c.nivel,
        c.paralelo,
        e.fecha_nacimiento,
        e.email,
        e.telefono,
        e.genero
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      WHERE c.nombre = ?
      ORDER BY e.nombres, e.apellidos
    `, [courseName]);

    return rows as Student[];
  } catch (error) {
    console.error('Error fetching students by course:', error);
    throw new Error('Error al obtener estudiantes del curso');
  }
}

/**
 * Obtiene un estudiante por ID
 */
export async function getStudentById(studentId: number): Promise<Student | null> {
  try {
    const [rows] = await ceiafPool.query(`
      SELECT 
        e.id_estudiante as id,
        CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
        e.cedula,
        c.nombre as curso_nombre,
        c.nivel,
        c.paralelo,
        e.fecha_nacimiento,
        e.email,
        e.telefono,
        e.genero
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      WHERE e.id_estudiante = ?
    `, [studentId]);

    const students = rows as Student[];
    return students.length > 0 ? students[0] : null;
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    throw new Error('Error al obtener estudiante');
  }
}

/**
 * Busca estudiantes por nombre
 */
export async function searchStudents(query: string): Promise<Student[]> {
  try {
    const [rows] = await ceiafPool.query(`
      SELECT 
        e.id_estudiante as id,
        CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
        e.cedula,
        c.nombre as curso_nombre,
        c.nivel,
        c.paralelo,
        e.fecha_nacimiento,
        e.email,
        e.telefono,
        e.genero
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      WHERE CONCAT(e.nombres, ' ', e.apellidos) LIKE ?
         OR e.nombres LIKE ?
         OR e.apellidos LIKE ?
         OR e.cedula LIKE ?
      ORDER BY e.nombres, e.apellidos
      LIMIT 50
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);

    return rows as Student[];
  } catch (error) {
    console.error('Error searching students:', error);
    throw new Error('Error al buscar estudiantes');
  }
}

/**
 * Obtiene todos los cursos disponibles
 */
export async function getAllCourses() {
  try {
    const [rows] = await ceiafPool.query(`
      SELECT 
        id_curso,
        nombre,
        nivel,
        paralelo,
        ano_lectivo
      FROM cursos
      ORDER BY nivel, nombre, paralelo
    `);

    return rows as any[];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error('Error al obtener cursos');
  }
}

/**
 * Obtiene todos los paralelos disponibles para un curso específico
 */
export async function getParalelosByCourse(courseId: string): Promise<string[]> {
  try {
    const numericCourseId = parseInt(courseId);
    
    // Mapeo correcto según la estructura de la base de datos
    const courseNameMapping: { [key: number]: string } = {
      8: 'Octavo EGB',    // Para frontend courseId=8 -> Octavo EGB
      9: 'Noveno EGB',    // Para frontend courseId=9 -> Noveno EGB
      10: 'Décimo EGB',   // Para frontend courseId=10 -> Décimo EGB
      11: 'Primero BGU',  // Para frontend courseId=11 -> Primero BGU
      12: 'Segundo BGU',  // Para frontend courseId=12 -> Segundo BGU
      13: 'Tercero BGU'   // Para frontend courseId=13 -> Tercero BGU
    };
    
    if (!isNaN(numericCourseId)) {
      const courseName = courseNameMapping[numericCourseId];
      
      if (!courseName) {
        // Si no hay mapeo específico, usar paralelos por defecto
        switch (numericCourseId) {
          case 8:
          case 9:
          case 10:
            return ['A', 'B', 'C'];
          case 11:
          case 12:
          case 13:
            return ['A', 'B'];
          default:
            return ['A'];
        }
      }
      
      // Consultar todos los paralelos disponibles para este nombre de curso
      const [rows] = await ceiafPool.query(`
        SELECT DISTINCT c.paralelo
        FROM cursos c
        INNER JOIN estudiantes e ON e.id_curso = c.id_curso
        WHERE c.nombre = ? AND c.paralelo IS NOT NULL AND c.paralelo != ''
        ORDER BY c.paralelo
      `, [courseName]);

      const paralelos = (rows as any[]).map(row => row.paralelo);
      
      // Si no hay paralelos en la DB, devolver por defecto
      if (paralelos.length === 0) {
        switch (numericCourseId) {
          case 8:
          case 9:
          case 10:
            return ['A', 'B', 'C'];
          case 11:
          case 12:
          case 13:
            return ['A', 'B'];
          default:
            return ['A'];
        }
      }
      
      return paralelos;
    } else {
      // Para compatibilidad con sistema anterior (mapeo por string)
      const courseMapping: { [key: string]: string } = {
        '8vo': 'Octavo EGB',
        '9no': 'Noveno EGB', 
        '10mo': 'Décimo EGB',
        '1bgu': 'Primero BGU',
        '2bgu': 'Segundo BGU',
        '3bgu': 'Tercero BGU'
      };

      const courseName = courseMapping[courseId];
      if (!courseName) {
        throw new Error(`Curso no encontrado: ${courseId}`);
      }
      
      const [rows] = await ceiafPool.query(`
        SELECT DISTINCT c.paralelo
        FROM cursos c
        INNER JOIN estudiantes e ON e.id_curso = c.id_curso
        WHERE c.nombre = ? AND c.paralelo IS NOT NULL AND c.paralelo != ''
        ORDER BY c.paralelo
      `, [courseName]);

      const paralelos = (rows as any[]).map(row => row.paralelo);
      return paralelos.length > 0 ? paralelos : ['A'];
    }
  } catch (error) {
    console.error('Error fetching paralelos by course:', error);
    throw new Error('Error al obtener paralelos del curso');
  }
}