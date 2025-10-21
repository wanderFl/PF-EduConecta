import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { Credentials, ApiError } from "../../types";
import "./LoginForm.css";
import { useNavigate } from "react-router-dom";

export const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [values, setValues] = useState<Credentials>({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  setValues((v) => ({
    ...v,
    [e.target.name]: e.target.name === "email"
      ? e.target.value.trim().toLowerCase()
      : e.target.value
  }));

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    await login(values);

    //redirigir por rol
    const stored = localStorage.getItem("edu_user");
    if (stored) {
      const user = JSON.parse(stored) as { role: "DIRECTIVO" | "DOCENTE" | "FAMILIA" };
      const path =
        user.role === "DIRECTIVO" ? "/directivo" :
        user.role === "DOCENTE"   ? "/docente"   :
                                    "/familia";
      navigate(path, { replace: true });
    } else {
      navigate("/login", { replace: true });
    }

  } catch (err) {
    const apiError = err as { response?: { data?: ApiError } };
    setError(apiError.response?.data?.message || "Error al iniciar sesión");
  } finally {
    setLoading(false);
  }
};

    const togglePassword = () => setShowPassword(!showPassword);

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-card">
                    <img src="/escudo.png" alt="EduConecta" className="login-logo" />
                    <h1 className="login-title">EduConecta</h1>
                    <h2 className="login-subtitle">Iniciar Sesión</h2>
                    
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={values.email}
                                onChange={handleChange}
                                required
                                aria-label="Correo electrónico"
                                placeholder="Ingrese su correo"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <div className="password-input">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={values.password}
                                    onChange={handleChange}
                                    required
                                    aria-label="Contraseña"
                                    placeholder="Ingrese su contraseña"
                                />
                                <button
                                    type="button"
                                    onClick={togglePassword}
                                    className="password-toggle"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="form-links">
                            <a href="#" className="forgot-password">
                                ¿Olvidaste tu contraseña?
                            </a>
                            <a href="/register" className="register-link">
                                Registrarse como familia
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-button"
                        >
                            {loading ? "Iniciando sesión..." : "Ingresar"}
                        </button>
                    </form>
                </div>
            </div>
            
            <div className="login-right">
                <img src="/logo-ceiaf.png" alt="CEIAF" className="ceiaf-logo" />
                <p className="ceiaf-slogan">
                    La Educación es el Bienestar<br />del Mañana
                </p>
            </div>
        </div>
    );
};
