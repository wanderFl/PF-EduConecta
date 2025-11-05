// src/pages/LoginPage.tsx
import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

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
                }
            }
        }
    }, [user, initialized, navigate, location]);

    if (!initialized) {
        return <div>Cargando...</div>;
    }

    if (user) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
                <LoginForm />
            </div>
        </div>
    );
};