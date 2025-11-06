// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, BrowserRouter, Outlet } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { DashboardDocente } from "../pages/DashboardDocente";
import { DashboardFamilia } from "../pages/DashboardFamilia";
import { ProtectedRoute } from "./ProtectedRoute";
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import  FamilyProvider  from "../contexts/FamilyProvider";
import WeeklyTasksPage from "../pages/WeeklyTasksPage"; // 👈 nuevo
import MonthlyAttendancePage from "../pages/MonthlyAttendancePage";
import PinGate from "./PinGate";
import CommunicationsPage from "../pages/CommunicationsPage";
import GradesPage from "../pages/GradesPage";
import DirectivoProvider  from "../contexts/DirectivoProvider";
import DirectivoSelectCoursePage from "../pages/DirectivoSelectCoursePage";
import DirectivoDashboard from "../pages/DirectivoDashboard";
import DirectivoRendimientoPage from "../pages/DirectivoRendimientoPage";
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />

            {/* Grupo Directivo */}
            <Route path="/directivo" element={<DirectivoLayout />}>
                <Route index element={<DirectivoSelectCoursePage />} />
                <Route path="dashboard" element={<DirectivoDashboard />} />
                {/* Placeholders por ahora */}
                <Route path="rendimiento" element={<DirectivoRendimientoPage />} />
                <Route path="asistencia"  element={<div style={{padding:16}}>Asistencia (próximamente)</div>} />
            </Route>

            <Route
                path="/docente"
                element={
                    <ProtectedRoute roles={["DOCENTE"]}>
                        <DashboardDocente />
                    </ProtectedRoute>
                }
            />
            {/* Grupo Familia con un solo FamilyProvider compartido */}
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
            <Route path="*" element={<LoginPage />} />
        </Routes>
    </BrowserRouter>
);