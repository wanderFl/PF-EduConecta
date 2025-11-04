// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { DashboardDirectivo } from "../pages/DashboardDirectivo";
import { DashboardDocente } from "../pages/DashboardDocente";
import { DashboardFamilia } from "../pages/DashboardFamilia";
// Docente sub-dashboards
import AgendaEscolar from "../pages/docente/AgendaEscolar";
import Asistencia from "../pages/docente/Asistencia";
import Comunicados from "../pages/docente/Comunicados";
import RegistrarCalificaciones from "../pages/docente/RegistrarCalificaciones";
import GestionarFaltas from "../pages/docente/GestionarFaltas";
import CreacionTareas from "../pages/docente/CreacionTareas";
import CourseSelection from "../pages/docente/CourseSelection";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes: React.FC = () => (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/directivo"
                    element={
                        <ProtectedRoute roles={["DIRECTIVO"]}>
                            <DashboardDirectivo />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/docente"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <CourseSelection />
                        </ProtectedRoute>
                    }
                />
                {/* Dashboard del docente con curso seleccionado */}
                <Route
                    path="/docente/dashboard"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <DashboardDocente />
                        </ProtectedRoute>
                    }
                />
                {/* Rutas específicas de docente */}
                <Route
                    path="/docente/agenda"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <AgendaEscolar />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/docente/asistencia"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <Asistencia />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/docente/comunicados"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <Comunicados />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/docente/calificaciones"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <RegistrarCalificaciones />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/docente/faltas"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <GestionarFaltas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/docente/tareas"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <CreacionTareas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/familia"
                    element={
                        <ProtectedRoute roles={["FAMILIA"]}>
                            <DashboardFamilia />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
);