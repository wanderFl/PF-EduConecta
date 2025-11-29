// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardDirectivo } from "../pages/DashboardDirectivo";
import { DashboardDocente } from "../pages/DashboardDocente";
import { DashboardFamilia } from "../pages/DashboardFamilia";
import { DashboardInspector } from "../pages/DashboardInspector";
import Novedades from "../pages/Inspector/Novedades";
import AsistenciaInspector from "../pages/Inspector/Asistencia";
import GestionarFaltas from "../pages/Inspector/GestionarFaltas";
// Docente sub-dashboards
import AgendaPage from "../pages/docente/AgendaPage";
import Comunicados from "../pages/docente/Comunicados";
import RegistrarCalificaciones from "../pages/docente/RegistrarCalificaciones";
import CreacionTareas from "../pages/docente/CreacionTareas";
import CourseSelection from "../pages/docente/CourseSelection";
import SubjectSelection from "../pages/docente/SubjectSelection";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes: React.FC = () => (
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
                {/* Selección de materia dentro del curso */}
                <Route
                    path="/docente/subjects"
                    element={
                        <ProtectedRoute roles={["DOCENTE"]}>
                            <SubjectSelection />
                        </ProtectedRoute>
                    }
                />
                {/* Dashboard del docente con curso y materia seleccionados */}
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
                            <AgendaPage />
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
                <Route
                    path="/inspector"
                    element={
                        <ProtectedRoute roles={["INSPECTOR"]}>
                            <DashboardInspector />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inspector/dashboard"
                    element={
                        <ProtectedRoute roles={["INSPECTOR"]}>
                            <DashboardInspector />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inspector/novedades"
                    element={
                        <ProtectedRoute roles={["INSPECTOR"]}>
                            <Novedades />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inspector/asistencia"
                    element={
                        <ProtectedRoute roles={["INSPECTOR"]}>
                            <AsistenciaInspector />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inspector/gestionar-faltas"
                    element={
                        <ProtectedRoute roles={["INSPECTOR"]}>
                            <GestionarFaltas />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<LoginPage />} />
            </Routes>
    </BrowserRouter>
);