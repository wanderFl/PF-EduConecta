// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, BrowserRouter, Outlet } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { DashboardDirectivo } from "../pages/DashboardDirectivo";
import { DashboardDocente } from "../pages/DashboardDocente";
import { DashboardFamilia } from "../pages/DashboardFamilia";
import { ProtectedRoute } from "./ProtectedRoute";
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import  FamilyProvider  from "../contexts/FamilyProvider";
import WeeklyTasksPage from "../pages/WeeklyTasksPage"; // 👈 nuevo
import MonthlyAttendancePage from "../pages/MonthlyAttendancePage";

const FamiliaLayout: React.FC = () => (
  <ProtectedRoute roles={["FAMILIA"]}>
    <FamilyProvider>
      <Outlet />
    </FamilyProvider>
  </ProtectedRoute>
);

export const AppRoutes: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
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
                        <DashboardDocente />
                    </ProtectedRoute>
                }
            />
            {/* Grupo Familia con un solo FamilyProvider compartido */}
            <Route path="/familia" element={<FamiliaLayout />}>
                <Route index element={<DashboardFamilia />} />
                <Route path="tareas" element={<WeeklyTasksPage />} />
                <Route path="/familia/asistencia" element={<MonthlyAttendancePage />} />
            </Route>      
            <Route path="*" element={<LoginPage />} />
        </Routes>
    </BrowserRouter>
);