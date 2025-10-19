// src/pages/DashboardDocente.tsx
import React from "react";
import { useAuth } from "../hooks/useAuth";

export const DashboardDocente: React.FC = () => {
    const { user, logout } = useAuth();
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Panel Docente</h2>
            <div className="mb-4">Bienvenido/a {user?.email}</div>
            <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded"
            >
                Cerrar sesión
            </button>
        </div>
    );
};