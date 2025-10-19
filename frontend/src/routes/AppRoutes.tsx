// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { DashboardDirectivo } from "../pages/DashboardDirectivo";
import { DashboardDocente } from "../pages/DashboardDocente";
import { DashboardFamilia } from "../pages/DashboardFamilia";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
);