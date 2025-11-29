// src/types/index.ts
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

export interface ParentRegistration {
    full_name: string;
    email: string;
    cedula: string;
    home_address: string;
    work_place: string;
    security_pin: string;
    password: string;
    confirmPassword: string;
}

export interface Course {
    id: string;
    name: string;
    description: string;
    color: string;
}

export interface ApiError {
    message: string;
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
