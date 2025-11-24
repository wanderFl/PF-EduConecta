// src/pages/DashboardDocente.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { Course } from "../types";
import "./DashboardDocente.css";

export const DashboardDocente: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    useEffect(() => {
        const courseData = localStorage.getItem('selectedCourseData');
        if (!courseData) {
            navigate('/docente');
            return;
        }
        
        try {
            const course = JSON.parse(courseData);
            setSelectedCourse(course);
        } catch (error) {
            console.error('Error parsing course data:', error);
            navigate('/docente');
        }
    }, [navigate]);

    const dashboardItems = [
        {
            title: "Agenda Escolar Digital",
            description: "Gestionar calendario académico y planificar actividades escolares",
            path: "/docente/agenda",
            icon: "📅"
        },
        {
            title: "Comunicados",
            description: "Enviar notificaciones y comunicados importantes a las familias",
            path: "/docente/comunicados",
            icon: "📢"
        },
        {
            title: "Registrar Calificaciones",
            description: "Gestionar notas, evaluaciones y seguimiento académico",
            path: "/docente/calificaciones",
            icon: "📝"
        },
        {
            title: "Creación de Tareas",
            description: "Crear, asignar y gestionar tareas y actividades académicas",
            path: "/docente/tareas",
            icon: "📚"
        }
    ];

    const eventosImportantes = [
        {
            title: "Justificativos de Faltas",
            description: "Tony Chen - Pendiente"
        },
        {
            title: "Felipe Caicedo",
            description: "Revisión de comportamiento"
        },
        {
            title: "María Fernández",
            description: "Entrevista programada"
        }
    ];

    const tareasEntregadas = [
        {
            title: "Matemáticas - Tony Chen",
            description: "Álgebra básica completada"
        },
        {
            title: "Biología - Felipe Caicedo",
            description: "Ecosistemas entregado"
        },
        {
            title: "Lenguaje - María Fernández",
            description: "Ensayo literario revisado"
        }
    ];

    const handleChangeCourse = () => {
        localStorage.removeItem('selectedCourse');
        localStorage.removeItem('selectedCourseData');
        navigate('/docente');
    };

    if (!selectedCourse) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="header-section">
                <div className="header-content">
                    <div className="user-info">
                        <h1>Carolina Herrera</h1>
                        <p>{selectedCourse.name}</p>
                        <button 
                            onClick={handleChangeCourse}
                            style={{
                                background: 'transparent',
                                border: `2px solid ${selectedCourse.color}`,
                                color: selectedCourse.color,
                                padding: '0.5rem 1rem',
                                borderRadius: '15px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                marginTop: '0.5rem',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = selectedCourse.color;
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = selectedCourse.color;
                            }}
                        >
                            Cambiar Curso
                        </button>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        Cerrar sesión
                    </button>
                </div>
            </div>

            <div className="main-content">
                <div className="dashboard-grid">
                    {dashboardItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="dashboard-card"
                            style={{
                                borderLeftColor: selectedCourse.color
                            }}
                        >
                            <div className="card-header">
                                <div 
                                    className="card-icon"
                                    style={{
                                        background: `linear-gradient(135deg, ${selectedCourse.color}, ${selectedCourse.color}CC)`
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <h3 className="card-title">{item.title}</h3>
                            </div>
                            <p className="card-description">
                                {item.description} - {selectedCourse.name}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="events-sidebar">
                    <h3 className="sidebar-title">Eventos Importantes</h3>
                    {eventosImportantes.map((evento, index) => (
                        <div key={index} className="event-item">
                            <div className="event-title">{evento.title}</div>
                            <div className="event-description">{evento.description}</div>
                        </div>
                    ))}
                    
                    <div className="tareas-section">
                        <h3 className="sidebar-title">Tareas Entregadas</h3>
                        {tareasEntregadas.map((tarea, index) => (
                            <div key={index} className="event-item">
                                <div className="event-title">{tarea.title}</div>
                                <div className="event-description">{tarea.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};