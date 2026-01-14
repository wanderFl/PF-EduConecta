import { ceiafPool, executeQuery } from '../ext/ceiafDb';

export interface TeacherCourse {
  id_curso: number;
  nombre: string;
  nivel: string;
  paralelo: string;
  ano_lectivo: string;
  cantidad_estudiantes: number;
}

export interface TeacherSubject {
  id_materia: number;
  nombre_materia: string;
  id_curso: number;
  nombre_curso: string;
  nivel: string;
  paralelo: string;
}

export interface CourseWithSubjects {
  id_curso: number;
  nombre: string;
  nivel: string;
  paralelo: string;
  ano_lectivo: string;
  cantidad_estudiantes: number;
  materias: TeacherSubject[];
}

/**
 * Obtiene todos los cursos asignados a un docente desde MySQL
 */
export async function getTeacherCourses(teacherExternalId: number): Promise<TeacherCourse[]> {
  try {
    if (!ceiafPool) {
      throw new Error('MySQL CEIAF no disponible');
    }

    console.log('✅ Fetching courses for teacher:', teacherExternalId);
    const rows = await executeQuery(`
      SELECT DISTINCT
        c.id_curso,
        c.nombre,
        c.nivel,
        c.paralelo,
        c.ano_lectivo,
        COUNT(DISTINCT e.id_estudiante) as cantidad_estudiantes
      FROM cursos c
      INNER JOIN docente_materia_curso dmc ON c.id_curso = dmc.id_curso
      INNER JOIN estudiantes e ON c.id_curso = e.id_curso
      WHERE dmc.id_docente = ?
      GROUP BY c.id_curso, c.nombre, c.nivel, c.paralelo, c.ano_lectivo
      ORDER BY c.nivel, c.nombre, c.paralelo
    `, [teacherExternalId]);

    return rows as TeacherCourse[];
  } catch (error: any) {
    console.error('❌ Error fetching teacher courses:', error.message);
    throw new Error('Error al obtener cursos del docente');
  }
}

/**
 * Obtiene todas las materias que dicta un docente en un curso específico
 */
export async function getTeacherSubjectsByCourse(
  teacherExternalId: number,
  courseId: number
): Promise<TeacherSubject[]> {
  try {
    if (!ceiafPool) {
      throw new Error('MySQL CEIAF no disponible');
    }

    const [rows] = await ceiafPool.query(`
      SELECT 
        m.id_materia,
        m.nombre as nombre_materia,
        c.id_curso,
        c.nombre as nombre_curso,
        c.nivel,
        c.paralelo
      FROM materias m
      INNER JOIN docente_materia_curso dmc ON m.id_materia = dmc.id_materia
      INNER JOIN cursos c ON dmc.id_curso = c.id_curso
      WHERE dmc.id_docente = ? AND dmc.id_curso = ?
      ORDER BY m.nombre
    `, [teacherExternalId, courseId]);

    return rows as TeacherSubject[];
  } catch (error) {
    console.error('Error fetching teacher subjects by course:', error);
    throw new Error('Error al obtener materias del docente');
  }
}

/**
 * Obtiene todos los cursos con sus materias para un docente
 */
export async function getTeacherCoursesWithSubjects(
  teacherExternalId: number
): Promise<CourseWithSubjects[]> {
  try {
    // Primero obtenemos todos los cursos
    const courses = await getTeacherCourses(teacherExternalId);
    
    // Para cada curso, obtenemos sus materias
    const coursesWithSubjects: CourseWithSubjects[] = [];
    
    for (const course of courses) {
      const subjects = await getTeacherSubjectsByCourse(teacherExternalId, course.id_curso);
      coursesWithSubjects.push({
        ...course,
        materias: subjects
      });
    }

    return coursesWithSubjects;
  } catch (error) {
    console.error('Error fetching teacher courses with subjects:', error);
    throw new Error('Error al obtener cursos y materias del docente');
  }
}

/**
 * Obtiene estudiantes de un curso y materia específicos del docente
 */
export async function getStudentsByCourseAndSubject(
  teacherExternalId: number,
  courseId: number,
  subjectId: number
): Promise<any[]> {
  try {
    const [rows] = await ceiafPool.query(`
      SELECT 
        e.id_estudiante,
        CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
        e.cedula,
        c.nombre as curso_nombre,
        c.nivel,
        c.paralelo,
        m.nombre as materia_nombre
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      INNER JOIN docente_materia_curso dmc ON c.id_curso = dmc.id_curso
      INNER JOIN materias m ON dmc.id_materia = m.id_materia
      WHERE dmc.id_docente = ? 
        AND dmc.id_curso = ? 
        AND dmc.id_materia = ?
      ORDER BY e.apellidos, e.nombres
    `, [teacherExternalId, courseId, subjectId]);

    return rows as any[];
  } catch (error) {
    console.error('Error fetching students by course and subject:', error);
    throw new Error('Error al obtener estudiantes del curso y materia');
  }
}

/**
 * Verifica si un docente tiene permiso para acceder a un curso
 */
export async function verifyTeacherCourseAccess(
  teacherExternalId: number,
  courseId: number
): Promise<boolean> {
  try {
    if (!ceiafPool) {
      return false;
    }

    const [rows] = await ceiafPool.query(`
      SELECT COUNT(*) as count
      FROM docente_materia_curso
      WHERE id_docente = ? AND id_curso = ?
    `, [teacherExternalId, courseId]);

    const result = rows as any[];
    return result[0].count > 0;
  } catch (error) {
    console.error('Error verifying teacher course access:', error);
    return false;
  }
}

/**
 * Verifica si un docente tiene permiso para acceder a una materia en un curso
 */
export async function verifyTeacherSubjectAccess(
  teacherExternalId: number,
  courseId: number,
  subjectId: number
): Promise<boolean> {
  try {
    const [rows] = await ceiafPool.query(`
      SELECT COUNT(*) as count
      FROM docente_materia_curso
      WHERE id_docente = ? AND id_curso = ? AND id_materia = ?
    `, [teacherExternalId, courseId, subjectId]);

    const result = rows as any[];
    return result[0].count > 0;
  } catch (error) {
    console.error('Error verifying teacher subject access:', error);
    return false;
  }
}

/**
 * Obtiene información detallada de un docente
 */
export async function getTeacherInfo(teacherExternalId: number): Promise<any> {
  try {
    const [rows] = await ceiafPool.query(`
      SELECT 
        id_docente,
        nombres,
        apellidos,
        CONCAT(nombres, ' ', apellidos) as nombre_completo,
        cedula,
        email,
        telefono,
        especialidad
      FROM docentes
      WHERE id_docente = ?
    `, [teacherExternalId]);

    const teachers = rows as any[];
    return teachers.length > 0 ? teachers[0] : null;
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    throw new Error('Error al obtener información del docente');
  }
}
