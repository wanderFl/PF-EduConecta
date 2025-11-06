import api from "./api"; // tu axios preconfigurado
import type { CeiafCourse } from "../types";

export async function listCoursesForDirector(): Promise<CeiafCourse[]> {
  const { data } = await api.get("/directivo/courses");
  // tu backend responde { courses: [...] }
  if (data && Array.isArray(data.courses)) {
    return data.courses as CeiafCourse[];
  }
  return [];
}