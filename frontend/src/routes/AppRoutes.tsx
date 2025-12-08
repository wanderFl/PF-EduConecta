// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, BrowserRouter, Outlet } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
 
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
 
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
 
import FamilyProvider from "../contexts/FamilyProvider";
import WeeklyTasksPage from "../pages/WeeklyTasksPage";
import MonthlyAttendancePage from "../pages/MonthlyAttendancePage";
import PinGate from "./PinGate";
import CommunicationsPage from "../pages/CommunicationsPage";
import GradesPage from "../pages/GradesPage";
 
import DirectivoProvider from "../contexts/DirectivoProvider";
import DirectivoSelectCoursePage from "../pages/DirectivoSelectCoursePage";
import DirectivoDashboard from "../pages/DirectivoDashboard";
import DirectivoRendimientoPage from "../pages/DirectivoRendimientoPage";
import DirectivoSubjectPerformancePage from "../pages/DirectivoSubjectPerformancePage";
import DirectivoStudentSubjectPage from "../pages/DirectivoStudentSubjectPage";
import DirectivoBehaviorPage from "../pages/DirectivoBehaviorPage";
import DirectivoStudentBehaviorPage from "../pages/DirectivoStudentBehaviorPage";
 
const FamiliaLayout: React.FC = () => (
  <ProtectedRoute roles={["FAMILIA"]}>
    <FamilyProvider>
      <Outlet />
    </FamilyProvider>
  </ProtectedRoute>
);
 
const DirectivoLayout: React.FC = () => (
  <ProtectedRoute roles={["DIRECTIVO"]}>
    <DirectivoProvider>
      <Outlet />
    </DirectivoProvider>
  </ProtectedRoute>
);
 
export const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordForm />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />
 
      {/* ===== Grupo Directivo (con layout y contexto) ===== */}
      <Route path="/directivo" element={<DirectivoLayout />}>
        {/* Selección de curso al entrar */}
        <Route index element={<DirectivoSelectCoursePage />} />
        <Route path="dashboard" element={<DirectivoDashboard />} />
        <Route path="rendimiento" element={<DirectivoRendimientoPage />} />
        <Route
          path="grades/subject/:subjectId"
          element={<DirectivoSubjectPerformancePage />}
        />
        <Route
          path="grades/subject/:subjectId/student/:studentId"
          element={<DirectivoStudentSubjectPage />}
        />
        <Route path="comportamiento" element={<DirectivoBehaviorPage />} />
        <Route
          path="behavior/student/:studentId"
          element={<DirectivoStudentBehaviorPage />}
        />
      </Route>
 
      {/* ===== Grupo Docente ===== */}
      {/* Selección de curso */}
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
 
      {/* ===== Grupo Familia con un solo FamilyProvider compartido ===== */}
      <Route path="/familia" element={<FamiliaLayout />}>
        <Route index element={<DashboardFamilia />} />
        <Route path="tareas" element={<WeeklyTasksPage />} />
        <Route element={<PinGate />}>
          <Route path="asistencia" element={<MonthlyAttendancePage />} />
        </Route>
        <Route element={<PinGate />}>
          <Route path="comunicados" element={<CommunicationsPage />} />
        </Route>
        <Route path="calificaciones" element={<GradesPage />} />
      </Route>
 
      {/* ===== Grupo Inspector ===== */}
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
 
      {/* Catch-all */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  </BrowserRouter>
);