// src/types/index.ts
 
// ===== ROLES =====
export type Role = "DIRECTIVO" | "DOCENTE" | "FAMILIA" | "INSPECTOR";
 
export interface User {
  id: string;
  email: string;
  role: Role;
  external_id?: string | null;
}
 
export interface AuthResponse {
  user: User;
  token: string;
}
 
export interface Credentials {
  email: string;
  password: string;
}
 
export interface ApiError {
  message: string;
}
 
// ==========================================
// 📌 TIPOS DE TU RAMA (DOCENTE / TAREAS)
// ==========================================
 
export interface Course {
  id: string;
  name: string;
  description: string;
  color: string;
}
 
export interface Student {
  id: number;
  nombre_completo: string;
  grade?: number | null;
  file_reference?: string | null;
  submission_id?: string | null;
  comment_student?: string | null;
  comment_teacher?: string | null;
  submitted_at?: string | null;
  graded_at?: string | null;
  has_submission?: boolean;
}
 
export interface Task {
  id: string;
  title: string;
  instructions?: string | null;
  due_date: string;
  max_points?: number | null;
  file_reference?: string | null;
  created_at: string;
  students: Student[];
}
 
export interface TasksResponse {
  success: boolean;
  tasks: Task[];
}
 
export interface GradeResponse {
  success: boolean;
  message: string;
  submission: {
    id: string;
    grade: number;
    comment_teacher?: string | null;
    comment_student?: string | null;
    student_id: number;
    graded_at?: string | null;
    submitted_at?: string | null;
  };
}
 
// ==========================================
// 📌 TIPOS DE DEV (FAMILIA / DIRECTIVO / INSPECTOR)
// ==========================================
 
// ---- Estudiantes CEIAF ----
export interface CeiafStudent {
  id_estudiante: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  id_curso: number | null;
  curso_nombre?: string | null;
  curso_nivel?: string | null;
  curso_paralelo?: string | null;
  curso_ano_lectivo?: string | null;
}
 
// ---- Tareas para familia ----
export interface PendingTask {
  id: string;
  title: string;
  due_date: string;
  course_name?: string | null;
  teacher_external_id?: number;
  course_external_id?: number;
  status: "PENDING" | "SUBMITTED";
  grade?: number | null;
  submission_file?: string | null;
  instructions?: string | null;
}
 
// ---- Asistencia ----
export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT_UNJUSTIFIED"
  | "ABSENT_JUSTIFIED_PENDING"
  | "ABSENT_JUSTIFIED_ACCEPTED";
 
export interface AttendanceDay {
  date: string;
  status: AttendanceStatus;
}
 
export interface AttendanceMonthResp {
  year: number;
  month: number;
  from: string;
  to: string;
  days: AttendanceDay[];
}
 
// ---- Comunicaciones ----
export type ConversationKind = "THREAD" | "NOTICE";
export type MessageSender = "PARENT" | "TEACHER";
 
export interface Conversation {
  id: string;
  kind: ConversationKind;
  student_external_id: number;
  teacher_external_id: number;
  parent_id: string;
  is_behavioral_note: boolean;
  status: "OPEN" | "CLOSED";
  archived_by_parent: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  subject?: string | null;
  lastMessagePreview?: string | null;
 
  student_name?: string;
  teacher_name?: string;
}
 
export interface Attachment {
  url: string;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
}
 
export interface ConversationMessage {
  id: string;
  body: string;
  sender_role: MessageSender;
  createdAt: string;
  attachments?: Attachment[];
}
 
export interface PaginatedMessages {
  messages: ConversationMessage[];
  nextCursor?: string | null;
}
 
// ---- Calificaciones ----
export interface GradeRow {
  id: string;
  subject_id: number | null;
  subject_name: string;
  task_id: string;
  task_title: string;
  trimestre: number | null;
  aporte: number | null;
  due_date: string | null;
  submitted_at: string | null;
  grade: number | null;
  student_comment: string;
  teacher_comment: string;
  file_url: string | null;
  instructions: string | null;
}
 
export type CeiafCourse = {
  id_curso: number;
  nombre: string;
  nivel?: string | null;
  paralelo?: string | null;
  ano_lectivo?: string | null;
  display_name?: string | null;
};
 
// ---- Directivo: resumen por materia ----
export type GradesBySubjectItem = {
  subject_external_id: number;
  subject_name: string;
  avg: number | null;
 
  total_students: number;
  total_tasks: number;
  expected_submissions: number;
  delivered_count: number;
  delivered_pct: number;
};
 
export type SubjectStudentRow = {
  student_id: number;
  student_name: string;
  avg: number | null;
  delivered_count: number;
  late_count: number;
};
 
export type SubjectStudentsSummary = {
  total_students: number;
  total_tasks: number;
  total_expected_submissions: number;
  total_delivered: number;
  overall_delivered_pct: number;
  total_late: number;
  late_pct_over_past_due: number;
  low_performance_count: number;
};
 
export type SubjectStudentsPayload = {
  course_id: number;
  subject_id: number;
  subject_name: string;
  items: SubjectStudentRow[];
  summary: SubjectStudentsSummary;
};
 
// ---- Directivo: historial de tareas por estudiante ----
export interface StudentTaskRow {
  task_id: string;
  title: string;
  due_date: string;
  submitted_at: string | null;
  grade: number | null;
  trimestre: number | null;
  aporte: number | null;
  status: "ENTREGADA" | "NO_ENTREGADA" | "ENTREGADA_TARDE";
  instructions: string | null;
  file_url: string | null;
}
 
export interface StudentSubjectTasksPayload {
  course_id: number;
  subject_id: number;
  subject_name: string;
  student_id: number;
  student_name: string;
  items: StudentTaskRow[];
}
 
// ---- Comportamiento: cursos ----
export interface BehaviorItem {
  student_id: number;
  name: string;
  absences: number;
  absence_pct: number;
  reports: number;
  most_common_category: string;
  severity_counts: Record<string, number>;
  risk_level: "BAJO" | "MEDIO" | "ALTO";
}
 
export interface CourseBehaviorPayload {
  courseId: number;
  totalAttendanceDays: number;
  totalCourseReports: number;
  items: BehaviorItem[];
}
 
// ---- Comportamiento: detalle estudiante ----
export interface StudentBehaviorReportRow {
  id: string;
  date: string;
  category: string;
  severity: string;
  title: string;
  description: string;
}
 
export interface MonthlyAbsencesPoint {
  month: string;
  absences: number;
}
 
export interface StudentBehaviorPayload {
  student_id: number;
  student_name: string;
 
  total_reports: number;
  total_absences: number;
  total_days: number;
  absence_pct: number;
  risk_level: "BAJO" | "MEDIO" | "ALTO" | string;
  most_common_category: string | null;
 
  reports: StudentBehaviorReportRow[];
  monthly_absences: MonthlyAbsencesPoint[];
}