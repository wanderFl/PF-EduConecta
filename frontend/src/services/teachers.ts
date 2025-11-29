import api from './api';

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

export interface TeacherInfo {
  id_docente: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  cedula?: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
}

export interface StudentInSubject {
  id_estudiante: number;
  nombre_completo: string;
  cedula?: string;
  curso_nombre: string;
  nivel: string;
  paralelo: string;
  materia_nombre: string;
}

/**
 * Obtiene información del docente
 */
export async function getTeacherInfo(teacherId: number): Promise<TeacherInfo> {
  const response = await api.get(`/teachers/${teacherId}`);
  return response.data.data;
}

/**
 * Obtiene todos los cursos asignados a un docente
 */
export async function getTeacherCourses(teacherId: number): Promise<TeacherCourse[]> {
  const response = await api.get(`/teachers/${teacherId}/courses`);
  return response.data.data;
}

/**
 * Obtiene todos los cursos con sus materias
 */
export async function getTeacherCoursesWithSubjects(teacherId: number): Promise<CourseWithSubjects[]> {
  const response = await api.get(`/teachers/${teacherId}/courses-with-subjects`);
  return response.data.data;
}

/**
 * Obtiene las materias de un curso específico
 */
export async function getTeacherSubjectsByCourse(
  teacherId: number,
  courseId: number
): Promise<TeacherSubject[]> {
  const response = await api.get(`/teachers/${teacherId}/courses/${courseId}/subjects`);
  return response.data.data;
}

/**
 * Obtiene estudiantes de una materia específica en un curso
 */
export async function getStudentsByCourseAndSubject(
  teacherId: number,
  courseId: number,
  subjectId: number
): Promise<StudentInSubject[]> {
  const response = await api.get(
    `/teachers/${teacherId}/courses/${courseId}/subjects/${subjectId}/students`
  );
  return response.data.data;
}

const teacherService = {
  getTeacherInfo,
  getTeacherCourses,
  getTeacherCoursesWithSubjects,
  getTeacherSubjectsByCourse,
  getStudentsByCourseAndSubject
};

export default teacherService;
