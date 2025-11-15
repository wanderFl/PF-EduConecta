"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentsByCourse = getStudentsByCourse;
exports.getStudentById = getStudentById;
exports.searchStudents = searchStudents;
exports.getAllCourses = getAllCourses;
exports.getParalelosByCourse = getParalelosByCourse;
const ceiafDb_1 = require("../ext/ceiafDb");
/**
 * Obtiene todos los estudiantes de un curso específico
 */
async function getStudentsByCourse(courseId) {
    try {
        // Si el courseId es numérico, usar directamente el id_curso
        const numericCourseId = parseInt(courseId);
        if (!isNaN(numericCourseId)) {
            // Consulta directa por id_curso (más precisa)
            const [rows] = await ceiafDb_1.ceiafPool.query(`
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
            return rows;
        }
        // Mantener compatibilidad con el sistema anterior (mapeo por string)
        const courseMapping = {
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
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        return rows;
    }
    catch (error) {
        console.error('Error fetching students by course:', error);
        throw new Error('Error al obtener estudiantes del curso');
    }
}
/**
 * Obtiene un estudiante por ID
 */
async function getStudentById(studentId) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        const students = rows;
        return students.length > 0 ? students[0] : null;
    }
    catch (error) {
        console.error('Error fetching student by ID:', error);
        throw new Error('Error al obtener estudiante');
    }
}
/**
 * Busca estudiantes por nombre
 */
async function searchStudents(query) {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
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
        return rows;
    }
    catch (error) {
        console.error('Error searching students:', error);
        throw new Error('Error al buscar estudiantes');
    }
}
/**
 * Obtiene todos los cursos disponibles
 */
async function getAllCourses() {
    try {
        const [rows] = await ceiafDb_1.ceiafPool.query(`
      SELECT 
        id_curso,
        nombre,
        nivel,
        paralelo,
        ano_lectivo
      FROM cursos
      ORDER BY nivel, nombre, paralelo
    `);
        return rows;
    }
    catch (error) {
        console.error('Error fetching courses:', error);
        throw new Error('Error al obtener cursos');
    }
}
/**
 * Obtiene todos los paralelos disponibles para un curso específico
 */
async function getParalelosByCourse(courseId) {
    try {
        const numericCourseId = parseInt(courseId);
        // Mapeo correcto según la estructura de la base de datos
        const courseNameMapping = {
            8: 'Octavo EGB', // Para frontend courseId=8 -> Octavo EGB
            9: 'Noveno EGB', // Para frontend courseId=9 -> Noveno EGB
            10: 'Décimo EGB', // Para frontend courseId=10 -> Décimo EGB
            11: 'Primero BGU', // Para frontend courseId=11 -> Primero BGU
            12: 'Segundo BGU', // Para frontend courseId=12 -> Segundo BGU
            13: 'Tercero BGU' // Para frontend courseId=13 -> Tercero BGU
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
            const [rows] = await ceiafDb_1.ceiafPool.query(`
        SELECT DISTINCT c.paralelo
        FROM cursos c
        INNER JOIN estudiantes e ON e.id_curso = c.id_curso
        WHERE c.nombre = ? AND c.paralelo IS NOT NULL AND c.paralelo != ''
        ORDER BY c.paralelo
      `, [courseName]);
            const paralelos = rows.map(row => row.paralelo);
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
        }
        else {
            // Para compatibilidad con sistema anterior (mapeo por string)
            const courseMapping = {
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
            const [rows] = await ceiafDb_1.ceiafPool.query(`
        SELECT DISTINCT c.paralelo
        FROM cursos c
        INNER JOIN estudiantes e ON e.id_curso = c.id_curso
        WHERE c.nombre = ? AND c.paralelo IS NOT NULL AND c.paralelo != ''
        ORDER BY c.paralelo
      `, [courseName]);
            const paralelos = rows.map(row => row.paralelo);
            return paralelos.length > 0 ? paralelos : ['A'];
        }
    }
    catch (error) {
        console.error('Error fetching paralelos by course:', error);
        throw new Error('Error al obtener paralelos del curso');
    }
}
