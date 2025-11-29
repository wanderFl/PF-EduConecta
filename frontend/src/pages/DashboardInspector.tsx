// src/pages/DashboardInspector.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import './Inspector/inspector.css';

export const DashboardInspector: React.FC = () => {
    const navigate = useNavigate();
    
    return (
        <div className="inspector-container">
            {/* Top Navigation Bar */}
            <DashboardNavbar 
                title="EduConecta"
                subtitle="Panel de Inspector"
                icon="🔍"
            />
            
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="inspector-header">
                    <div className="inspector-header-content">
                        <div className="inspector-title-section">
                            <div className="inspector-icon">
                                🔍
                            </div>
                            <div>
                                <h1 className="inspector-title">
                                    Panel de Inspector
                                </h1>
                                <p className="inspector-subtitle">
                                    Sistema de supervisión y control educativo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="inspector-cards-grid">
                    {/* Control de Asistencia */}
                    <div className="inspector-card" onClick={() => navigate('/inspector/asistencia')}>
                        <div className="inspector-card-header">
                            <div className="inspector-card-icon green">
                                <span>✅</span>
                            </div>
                            <div>
                                <h3 className="inspector-card-title">
                                    Control de Asistencia
                                </h3>
                                <p className="inspector-card-label">
                                    Supervisión y registro por curso
                                </p>
                            </div>
                        </div>
                        <p className="inspector-card-description">
                            Gestiona y registra la asistencia de todos los estudiantes. 
                            Marca presentes, ausentes, tardanzas y justificaciones.
                        </p>
                        <button 
                            className="inspector-card-button green"
                            onClick={(e) => { e.stopPropagation(); navigate('/inspector/asistencia'); }}
                        >
                            Acceder a Asistencia
                        </button>
                    </div>

                    {/* Gestionar Faltas */}
                    <div className="inspector-card" onClick={() => navigate('/inspector/gestionar-faltas')}>
                        <div className="inspector-card-header">
                            <div className="inspector-card-icon orange">
                                <span>📋</span>
                            </div>
                            <div>
                                <h3 className="inspector-card-title">
                                    Gestionar Faltas
                                </h3>
                                <p className="inspector-card-label">
                                    Revisar justificaciones pendientes
                                </p>
                            </div>
                        </div>
                        <p className="inspector-card-description">
                            Revisa y aprueba o rechaza las justificaciones de ausencias enviadas por los estudiantes. 
                            Descarga archivos adjuntos y gestiona el estado de las justificaciones.
                        </p>
                        <button 
                            className="inspector-card-button orange"
                            onClick={(e) => { e.stopPropagation(); navigate('/inspector/gestionar-faltas'); }}
                        >
                            Gestionar Justificaciones
                        </button>
                    </div>

                    {/* Novedades Disciplinarias */}
                    <div className="inspector-card" onClick={() => navigate('/inspector/novedades')}>
                        <div className="inspector-card-header">
                            <div className="inspector-card-icon yellow">
                                <span>📝</span>
                            </div>
                            <div>
                                <h3 className="inspector-card-title">
                                    Novedades Disciplinarias
                                </h3>
                                <p className="inspector-card-label">
                                    Registro de incidentes y reportes
                                </p>
                            </div>
                        </div>
                        <p className="inspector-card-description">
                            Documenta y gestiona novedades disciplinarias de los estudiantes. 
                            Clasifica por severidad y categoría.
                        </p>
                        <button 
                            className="inspector-card-button yellow"
                            onClick={(e) => { e.stopPropagation(); navigate('/inspector/novedades'); }}
                        >
                            Acceder a Novedades
                        </button>
                    </div>
                </div>

                {/* Information Card */}
                <div className="inspector-info-card">
                    <div className="inspector-info-content">
                        <div className="inspector-info-icon">💡</div>
                        <div>
                            <h3 className="inspector-info-title">
                                Panel de Supervisión Inspector
                            </h3>
                            <p className="inspector-info-text">
                                Como inspector, tienes acceso completo a todas las funcionalidades de supervisión educativa. 
                                Puedes gestionar la asistencia de todos los cursos y paralelos, así como registrar novedades 
                                disciplinarias para mantener un seguimiento adecuado del comportamiento estudiantil.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="inspector-footer">
                    <p>Sistema EduConecta - Panel de Inspector | Última actualización: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};