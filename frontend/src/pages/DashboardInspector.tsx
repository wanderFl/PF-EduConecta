// src/pages/DashboardInspector.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './familia.css';

export const DashboardInspector: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    
    const dashboardItems = [
        {
            title: "Control de Asistencia",
            description: "Supervisión y registro por curso",
            path: "/inspector/asistencia",
            icon: "✅"
        },
        {
            title: "Gestionar Faltas",
            description: "Revisar justificaciones pendientes",
            path: "/inspector/gestionar-faltas",
            icon: "📋"
        },
        {
            title: "Novedades Disciplinarias",
            description: "Registro de incidentes y reportes",
            path: "/inspector/novedades",
            icon: "📝"
        }
    ];

    return (
        <div className="fam-layout">
            {/* Header */}
            <div className="fam-header">
                <div className="fam-header-left">
                    <div className="avatar-initials">IN</div>
                    <div className="parent-name">Panel de Inspector</div>
                </div>
                <div className="fam-header-center">
                    <span style={{ color: 'white', fontWeight: 600 }}>Sistema de supervisión y control educativo</span>
                </div>
                <button onClick={logout} className="logout-btn">
                    Cerrar sesión
                </button>
            </div>

            {/* Contenido */}
            <div className="fam-body">
                <div className="fam-main">
                    {/* Info Card */}
                    <div className="student-info-card">
                        <div className="sic-title">Panel de Inspector 🔍</div>
                        <div className="sic-row">
                            <span>Rol:</span>
                            <b>Inspector</b>
                        </div>
                        <div className="sic-row">
                            <span>Acceso:</span>
                            <b>Supervisión Educativa Completa</b>
                        </div>
                    </div>

                    {/* Acciones (tiles) */}
                    <div className="action-grid">
                        {dashboardItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(item.path)}
                                className="action-tile"
                            >
                                <div className="tile-icon">{item.icon}</div>
                                <div className="tile-label">{item.title}</div>
                                <div className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                                    {item.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar derecho */}
                <div className="fam-sidebar">
                    <div className="pending-panel">
                        <h3>💡 Información</h3>
                        <div className="pending-item">
                            <div className="pt-title">Panel de Supervisión</div>
                            <div className="pt-meta">
                                Como inspector, tienes acceso completo a todas las funcionalidades de supervisión educativa. 
                                Puedes gestionar la asistencia de todos los cursos y paralelos, así como registrar novedades 
                                disciplinarias para mantener un seguimiento adecuado del comportamiento estudiantil.
                            </div>
                        </div>
                    </div>
                    
                    <div className="pending-panel" style={{ marginTop: '16px' }}>
                        <h3>📌 Accesos Rápidos</h3>
                        <ul className="pending-list">
                            <li className="pending-item clickable" onClick={() => navigate('/inspector/asistencia')}>
                                <div className="pt-title">✅ Control de Asistencia</div>
                            </li>
                            <li className="pending-item clickable" onClick={() => navigate('/inspector/gestionar-faltas')}>
                                <div className="pt-title">📋 Gestionar Faltas</div>
                            </li>
                            <li className="pending-item clickable" onClick={() => navigate('/inspector/novedades')}>
                                <div className="pt-title">📝 Novedades</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};