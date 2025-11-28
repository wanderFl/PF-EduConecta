// src/types/index.ts
export type Role = "DIRECTIVO" | "DOCENTE" | "FAMILIA";

export interface User {
    id: string;
    email: string;
    role: Role;
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

export interface ParentRegistration {
    full_name: string;
    email: string;
    cedula: string;
    home_address?: string;
    work_place?: string;
    security_pin: string;
    password: string;
    confirmPassword: string;
}

// Datos que devuelve /api/familia/hijos y /buscar-estudiante
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

export interface PendingTask {
  id: string;
  title: string;
  due_date: string; // ISO string (ej. "2025-10-28T00:00:00.000Z")
  course_name?: string | null; // opcional si se requiere mostrar curso
  teacher_external_id?: number;
  course_external_id?: number;
  status: "PENDING" | "SUBMITTED"; // indica si fue entregada o no
  grade?: number | null; // nota obtenida (si ya fue corregida)
  submission_file?: string | null; // referencia al archivo entregado (si existe)
  instructions?: string | null; // instrucciones adicionales de la tarea
}

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT_UNJUSTIFIED"
  | "ABSENT_JUSTIFIED_PENDING"
  | "ABSENT_JUSTIFIED_ACCEPTED";

export interface AttendanceDay {
  date: string;           // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface AttendanceMonthResp {
  year: number;
  month: number;          // 1-12
  from: string;           // YYYY-MM-DD
  to: string;             // YYYY-MM-DD
  days: AttendanceDay[];  // solo días con registro
}

// --- Comunicados ---
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
  subject?: string | null;              // 👈 opcional
  lastMessagePreview?: string | null;   // 👈 opcional
  // opcionalmente: count mensajes/preview si el backend lo expone
  /** añadidos desde backend */
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
  avg: number | null;          // promedio individual (solo sobre entregas con nota)
  delivered_count: number;     // entregas registradas (SubmissionGrade)
  late_count: number;          // tareas vencidas sin entrega (ver nota)
};

export type SubjectStudentsSummary = {
  total_students: number;
  total_tasks: number;            // # de tareas de esa materia en el curso
  total_expected_submissions: number; // total_students * total_tasks
  total_delivered: number;           // sum(delivered_count)
  overall_delivered_pct: number;     // total_delivered / total_expected_submissions * 100
  total_late: number;                // sum(late_count)
  late_pct_over_past_due: number;    // total_late / (total_students * tasksPastDue) * 100
  low_performance_count: number;     // estudiantes con avg < 7
};

export type SubjectStudentsPayload = {
  course_id: number;
  subject_id: number;
  subject_name: string;
  items: SubjectStudentRow[];
  summary: SubjectStudentsSummary;
};

// types.ts (frontend)
export interface StudentTaskRow {
  task_id: string;
  title: string;
  due_date: string;          // viene en ISO
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

// Indicador de comportamiento (detalle estudiante)
export interface StudentBehaviorReportRow {
  id: string;
  date: string; // ISO
  category: string;
  severity: string;
  title: string;
  description: string;
}

export interface MonthlyAbsencesPoint {
  month: string; // "2025-01"
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
