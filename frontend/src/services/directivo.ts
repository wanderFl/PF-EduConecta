import api from "./api"; // tu axios preconfigurado
import type { CeiafCourse, GradesBySubjectItem } from "../types";

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