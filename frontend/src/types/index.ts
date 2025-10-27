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
