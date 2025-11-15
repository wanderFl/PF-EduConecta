import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GestionarFaltasComponent from "../../components/GestionarFaltas";
import type { Course } from "../../types";
import "./GestionarFaltasPage.css";

const GestionarFaltas: React.FC = () => {
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
        } catch {
            navigate('/docente');
        }
    }, [navigate]);

    if (!selectedCourse) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p>Cargando curso seleccionado...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            {/* Botón de navegación fijo */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 999
            }}>
                <button
                    onClick={() => navigate("/docente/dashboard")}
                    style={{
                        background: '#6c757d',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
                >
                    <i className="fas fa-arrow-left"></i>
                    Volver al Dashboard
                </button>
            </div>

            {/* Información del curso */}
            <div style={{
                background: 'white',
                padding: '16px 20px',
                borderBottom: '2px solid #3498db',
                marginBottom: '0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <i className="fas fa-chalkboard-teacher" style={{ color: '#3498db', fontSize: '1.2rem' }}></i>
                    <span style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        color: '#2c3e50' 
                    }}>
                        Curso Activo: {selectedCourse.name}
                    </span>
                </div>
            </div>

            {/* Componente principal */}
            <GestionarFaltasComponent />
        </div>
    );
};

export default GestionarFaltas;