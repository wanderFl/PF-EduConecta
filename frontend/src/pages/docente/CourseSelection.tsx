import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Course } from "../../types";

const CourseSelection: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const courses: Course[] = [
        {
            id: "8vo",
            name: "8vo Básica",
            description: "Octavo año de Educación General Básica",
            color: "#3498db"
        },
        {
            id: "9no",
            name: "9no Básica", 
            description: "Noveno año de Educación General Básica",
            color: "#e74c3c"
        },
        {
            id: "10mo",
            name: "10mo Básica",
            description: "Décimo año de Educación General Básica",
            color: "#f39c12"
        },
        {
            id: "1bgu",
            name: "1ro BGU",
            description: "Primer año de Bachillerato General Unificado",
            color: "#9b59b6"
        },
        {
            id: "2bgu",
            name: "2do BGU",
            description: "Segundo año de Bachillerato General Unificado",
            color: "#1abc9c"
        },
        {
            id: "3bgu",
            name: "3ro BGU",
            description: "Tercer año de Bachillerato General Unificado",
            color: "#34495e"
        }
    ];

    const handleCourseSelect = (courseId: string) => {
        localStorage.setItem('selectedCourse', courseId);
        const selectedCourseData = courses.find(c => c.id === courseId);
        
        if (selectedCourseData) {
            localStorage.setItem('selectedCourseData', JSON.stringify(selectedCourseData));
        }
        
        navigate('/docente/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem 2rem',
                marginBottom: '2rem',
                borderRadius: '0 0 20px 20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{
                            color: '#2c3e50',
                            fontSize: '2rem',
                            fontWeight: '700',
                            margin: '0 0 0.5rem 0'
                        }}>
                            Seleccionar Curso
                        </h1>
                        <p style={{
                            color: '#7f8c8d',
                            fontSize: '1.1rem',
                            margin: '0'
                        }}>
                            Bienvenido/a {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '25px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {courses.map((course) => (
                    <div
                        key={course.id}
                        onClick={() => handleCourseSelect(course.id)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '20px',
                            padding: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${course.color}20`,
                            position: 'relative' as const,
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            background: course.color
                        }} />
                        
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: course.color,
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                marginRight: '1rem',
                                boxShadow: `0 4px 15px ${course.color}30`,
                                color: 'white',
                                fontWeight: 'bold'
                            }}>
                                {course.id.toUpperCase()}
                            </div>
                            <h3 style={{
                                fontSize: '1.4rem',
                                fontWeight: '700',
                                color: '#2c3e50',
                                margin: '0',
                                lineHeight: '1.2'
                            }}>
                                {course.name}
                            </h3>
                        </div>
                        
                        <p style={{
                            color: '#7f8c8d',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            margin: '0'
                        }}>
                            {course.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseSelection;