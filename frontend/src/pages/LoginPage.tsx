// src/pages/LoginPage.tsx
import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { LogoutButton } from "../components/auth/LogoutButton";

export const LoginPage: React.FC = () => {
    const { user, initialized } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (initialized && user) {
            const from = location.state?.from?.pathname;
            if (from) {
                navigate(from);
            } else {
                switch (user.role) {
                    case "DIRECTIVO":
                        navigate("/directivo");
                        break;
                    case "DOCENTE":
                        navigate("/docente");
                        break;
                    case "FAMILIA":
                        navigate("/familia");
                        break;
                    case "INSPECTOR":
                        navigate("/inspector");
                        break;
                }
            }
        }
    }, [user, initialized, navigate, location]);

    if (!initialized) {
        return <div>Cargando...</div>;
    }

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Ya tienes una sesión activa
                        </h2>
                        <p className="text-gray-600 mb-2">
                            Conectado como: <span className="font-medium">{user.email}</span>
                        </p>
                        <p className="text-gray-600 mb-6">
                            Rol: <span className="font-medium capitalize">{user.role}</span>
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    switch (user.role) {
                                        case "DIRECTIVO":
                                            navigate("/directivo");
                                            break;
                                        case "DOCENTE":
                                            navigate("/docente");
                                            break;
                                        case "FAMILIA":
                                            navigate("/familia");
                                            break;
                                        case "INSPECTOR":
                                            navigate("/inspector");
                                            break;
                                    }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                            >
                                Ir al Dashboard
                            </button>
                            <LogoutButton 
                                className="w-full" 
                                variant="outline" 
                                size="md"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
                <LoginForm />
            </div>
        </div>
    );
};