import api from "./api";
const teacherNameCache = new Map<number, string>();
const teacherSubjectCache = new Map<number, string>();
const studentNameCache = new Map<number, string>();

export async function getStudentName(studentId: number): Promise<string> {
  if (studentNameCache.has(studentId)) return studentNameCache.get(studentId)!;

  const { data } = await api.get(`/ceiaf/student/${studentId}`);
  const v = data.fullName ?? `Estudiante #${studentId}`;
  studentNameCache.set(studentId, v);
  return v;
}

export async function getTeacherName(teacherId: number): Promise<string> {
  if (teacherNameCache.has(teacherId)) return teacherNameCache.get(teacherId)!;

  const { data } = await api.get(`/ceiaf/teacher/${teacherId}`);
  const v = data.fullName ?? `Docente #${teacherId}`;
  teacherNameCache.set(teacherId, v);
  return v;
}

export async function getTeacherSubject(teacherId: number): Promise<string> {
  if (teacherSubjectCache.has(teacherId)) return teacherSubjectCache.get(teacherId)!;
  const { data } = await api.get<{ subject: string | null }>(`/ceiaf/teacher/${teacherId}/subject`);
  const v = data?.subject ?? "Materia";
  teacherSubjectCache.set(teacherId, v);
  return v;
}