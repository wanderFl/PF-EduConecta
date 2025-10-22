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