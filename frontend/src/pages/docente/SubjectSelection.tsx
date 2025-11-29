import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import teacherService, { type TeacherSubject } from "../../services/teachers";

interface CourseInfo {
    id: string;
    name: string;
    description?: string;
    nivel?: string;
    paralelo?: string;
    ano_lectivo?: string;
    cantidad_estudiantes?: number;
}

const SubjectSelection: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);

    // Colores para las materias
    const subjectColors = [
        '#3498db', '#e74c3c', '#f39c12', '#9b59b6', 
        '#1abc9c', '#34495e', '#16a085', '#c0392b',
        '#8e44ad', '#2980b9', '#27ae60', '#d35400'
    ];

    useEffect(() => {
        const loadSubjectsForCourse = async (courseId: string) => {
            try {
                setLoading(true);
                setError(null);

                // Obtener el external_id del usuario logueado (contexto primero)
                const userStr = localStorage.getItem('edu_user');
                let teacherExternalId: string | null = null;
                
                if (userStr) {
                    try {
                        const userData = JSON.parse(userStr);
                        teacherExternalId = userData.external_id || null;
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                    }
                }
                
                if (!teacherExternalId) {
                    setError('No se encontró el ID del docente. Por favor, cierre sesión e inicie nuevamente.');
                    console.error('Missing external_id for teacher');
                    return;
                }

                const subjectsData = await teacherService.getTeacherSubjectsByCourse(
                    parseInt(teacherExternalId),
                    parseInt(courseId)
                );
                setSubjects(subjectsData);
            } catch (err) {
                console.error('Error loading subjects:', err);
                setError('Error al cargar las materias. Por favor, intente nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        // Obtener información del curso desde localStorage
        const courseData = localStorage.getItem('selectedCourseData');
        if (!courseData) {
            navigate('/docente');
            return;
        }

        try {
            const course = JSON.parse(courseData);
            setCourseInfo(course);
            loadSubjectsForCourse(course.id);
        } catch (error) {
            console.error('Error parsing course data:', error);
            navigate('/docente');
        }
    }, [navigate]);

    const handleSubjectSelect = (subject: TeacherSubject) => {
        // Guardar la materia seleccionada en localStorage
        localStorage.setItem('selectedSubject', subject.id_materia.toString());
        localStorage.setItem('selectedSubjectData', JSON.stringify({
            id_materia: subject.id_materia,
            nombre_materia: subject.nombre_materia,
            id_curso: subject.id_curso,
            nombre_curso: subject.nombre_curso,
            nivel: subject.nivel,
            paralelo: subject.paralelo
        }));
        
        // Navegar al dashboard con la materia seleccionada
        navigate('/docente/dashboard');
    };

    const handleBack = () => {
        localStorage.removeItem('selectedCourse');
        localStorage.removeItem('selectedCourseData');
        navigate('/docente');
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
                        <button
                            onClick={handleBack}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3498db',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                marginBottom: '0.5rem',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            ← Volver a cursos
                        </button>
                        <h1 style={{
                            color: '#2c3e50',
                            fontSize: '2rem',
                            fontWeight: '700',
                            margin: '0 0 0.5rem 0'
                        }}>
                            Seleccionar Materia
                        </h1>
                        {courseInfo && (
                            <p style={{
                                color: '#7f8c8d',
                                fontSize: '1.1rem',
                                margin: '0'
                            }}>
                                {courseInfo.name} - Paralelo {courseInfo.paralelo}
                            </p>
                        )}
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
                margin: '0 auto'
            }}>
                {loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>Cargando materias...</p>
                    </div>
                )}

                {error && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(231, 76, 60, 0.1)',
                        borderRadius: '20px',
                        border: '1px solid #e74c3c'
                    }}>
                        <p style={{ fontSize: '1.2rem', color: '#e74c3c', marginBottom: '1rem' }}>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && !error && subjects.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
                            No tiene materias asignadas en este curso.
                        </p>
                    </div>
                )}

                {!loading && !error && subjects.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        {subjects.map((subject, index) => {
                            const color = subjectColors[index % subjectColors.length];
                            return (
                                <div
                                    key={subject.id_materia}
                                    onClick={() => handleSubjectSelect(subject)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '20px',
                                        padding: '2rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                                        backdropFilter: 'blur(10px)',
                                        border: `1px solid ${color}20`,
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
                                        background: color
                                    }} />
                                    
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: color,
                                            borderRadius: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            marginRight: '1rem',
                                            boxShadow: `0 4px 15px ${color}30`,
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            📚
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.4rem',
                                            fontWeight: '700',
                                            color: '#2c3e50',
                                            margin: '0',
                                            lineHeight: '1.2'
                                        }}>
                                            {subject.nombre_materia}
                                        </h3>
                                    </div>
                                    
                                    <p style={{
                                        color: '#7f8c8d',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        margin: '0'
                                    }}>
                                        {subject.nombre_curso} - Paralelo {subject.paralelo}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectSelection;
