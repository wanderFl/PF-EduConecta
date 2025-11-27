"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherCourses = getTeacherCourses;
exports.getTeacherSubjectsByCourse = getTeacherSubjectsByCourse;
exports.getTeacherCoursesWithSubjects = getTeacherCoursesWithSubjects;
exports.getStudentsByCourseAndSubject = getStudentsByCourseAndSubject;
exports.verifyTeacherCourseAccess = verifyTeacherCourseAccess;
exports.verifyTeacherSubjectAccess = verifyTeacherSubjectAccess;
exports.getTeacherInfo = getTeacherInfo;
const ceiafDb_1 = require("../ext/ceiafDb");
/**
 * Obtiene todos los cursos asignados a un docente desde MySQL
 */
async function getTeacherCourses(teacherExternalId) {
    try {
        // Consulta que obtiene cursos únicos donde el docente tiene asignaciones
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        return rows;
    }
    catch (error) {
        console.error('Error fetching teacher courses:', error);
        throw new Error('Error al obtener cursos del docente');
    }
}
/**
 * Obtiene todas las materias que dicta un docente en un curso específico
 */
async function getTeacherSubjectsByCourse(teacherExternalId, courseId) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        return rows;
    }
    catch (error) {
        console.error('Error fetching teacher subjects by course:', error);
        throw new Error('Error al obtener materias del docente en el curso');
    }
}
/**
 * Obtiene todos los cursos con sus materias para un docente
 */
async function getTeacherCoursesWithSubjects(teacherExternalId) {
    try {
        // Primero obtenemos todos los cursos
        const courses = await getTeacherCourses(teacherExternalId);
        // Para cada curso, obtenemos sus materias
        const coursesWithSubjects = [];
        for (const course of courses) {
            const subjects = await getTeacherSubjectsByCourse(teacherExternalId, course.id_curso);
            coursesWithSubjects.push({
                ...course,
                materias: subjects
            });
        }
        return coursesWithSubjects;
    }
    catch (error) {
        console.error('Error fetching teacher courses with subjects:', error);
        throw new Error('Error al obtener cursos y materias del docente');
    }
}
/**
 * Obtiene estudiantes de un curso y materia específicos del docente
 */
async function getStudentsByCourseAndSubject(teacherExternalId, courseId, subjectId) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        return rows;
    }
    catch (error) {
        console.error('Error fetching students by course and subject:', error);
        throw new Error('Error al obtener estudiantes del curso y materia');
    }
}
/**
 * Verifica si un docente tiene permiso para acceder a un curso
 */
async function verifyTeacherCourseAccess(teacherExternalId, courseId) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
      SELECT COUNT(*) as count
      FROM docente_materia_curso
      WHERE id_docente = ? AND id_curso = ?
    `, [teacherExternalId, courseId]);
        const result = rows;
        return result[0].count > 0;
    }
    catch (error) {
        console.error('Error verifying teacher course access:', error);
        return false;
    }
}
/**
 * Verifica si un docente tiene permiso para acceder a una materia en un curso
 */
async function verifyTeacherSubjectAccess(teacherExternalId, courseId, subjectId) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
      SELECT COUNT(*) as count
      FROM docente_materia_curso
      WHERE id_docente = ? AND id_curso = ? AND id_materia = ?
    `, [teacherExternalId, courseId, subjectId]);
        const result = rows;
        return result[0].count > 0;
    }
    catch (error) {
        console.error('Error verifying teacher subject access:', error);
        return false;
    }
}
/**
 * Obtiene información detallada de un docente
 */
async function getTeacherInfo(teacherExternalId) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        const teachers = rows;
        return teachers.length > 0 ? teachers[0] : null;
    }
    catch (error) {
        console.error('Error fetching teacher info:', error);
        throw new Error('Error al obtener información del docente');
    }
}
