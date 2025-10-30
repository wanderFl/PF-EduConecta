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
