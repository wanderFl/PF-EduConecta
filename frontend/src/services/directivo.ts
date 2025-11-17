import api from "./api"; // tu axios preconfigurado
import type { CeiafCourse, GradesBySubjectItem, SubjectStudentsPayload, StudentSubjectTasksPayload } from "../types";

// Lista los cursos desde el endpoint del directivo
export async function listCoursesForDirector(): Promise<CeiafCourse[]> {
  const { data } = await api.get("/directivo/courses");
  // tu backend responde { courses: [...] }
  if (data && Array.isArray(data.courses)) {
    return data.courses as CeiafCourse[];
  }
  return [];
}

// Obtiene el promedio de calificaciones por materia para un curso específico
export async function getGradesBySubject(courseId: number): Promise<GradesBySubjectItem[]> {
  const { data } = await api.get(`/directivo/courses/${courseId}/analytics/grades-by-subject`);
  return (data?.items ?? []) as GradesBySubjectItem[];
}

// Obtiene el rendimiento de los estudiantes en una materia específica dentro de un curso
export async function getSubjectStudentsPerformance(
  courseId: number,
  subjectId: number,
  q?: string
): Promise<SubjectStudentsPayload> {
  const { data } = await api.get(`/directivo/courses/subject/${courseId}/${subjectId}/students`, {
    params: q?.trim() ? { q } : undefined,
  });
  return data as SubjectStudentsPayload;
}

// Obtiene las tareas de un estudiante en una materia específica dentro de un curso
export async function getStudentSubjectTasks(
  courseId: number,
  subjectId: number,
  studentId: number
): Promise<StudentSubjectTasksPayload> {
  const { data } = await api.get(
    `/directivo/courses/${courseId}/subject/${subjectId}/students/${studentId}/tasks`
  );
  return data as StudentSubjectTasksPayload;
}

// Genera una URL firmada para descargar el archivo de una tarea
export async function getSubmissionDownloadUrl(fileRef: string): Promise<string> {
  const { data } = await api.get("/directivo/submission-download-url", {
    params: { fileRef },
  });
  // El backend responde { url: "https://..." }
  return data.url as string;
}