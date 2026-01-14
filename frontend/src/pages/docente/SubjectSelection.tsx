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
            background: '#f7f8fb',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header estilo familia */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                background: '#1e4db7',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#d7e3ff',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#d7e3ff'}
                    >
                        ← Volver a cursos
                    </button>
                    <div>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#fff'
                        }}>
                            Seleccionar Materia
                        </div>
                        {courseInfo && (
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#d7e3ff',
                                marginTop: '2px'
                            }}>
                                {courseInfo.name} - Paralelo {courseInfo.paralelo}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={logout}
                    style={{
                        background: '#fff',
                        color: '#1e4db7',
                        border: '1px solid #d7e3ff',
                        padding: '8px 20px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f7ff';
                        e.currentTarget.style.borderColor = '#1e4db7';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#d7e3ff';
                    }}
                >
                    Cerrar sesión
                </button>
            </div>

            {/* Contenido principal */}
            <div style={{
                flex: 1,
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto',
                padding: '24px'
            }}>
                {loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>Cargando materias...</p>
                    </div>
                )}

                {error && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #ef4444',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <p style={{ fontSize: '1.1rem', color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#1e4db7',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1a3d8f'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#1e4db7'}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && !error && subjects.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                            No tiene materias asignadas en este curso.
                        </p>
                    </div>
                )}

                {!loading && !error && subjects.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {subjects.map((subject, index) => {
                            const color = subjectColors[index % subjectColors.length];
                            return (
                                <div
                                    key={subject.id_materia}
                                    onClick={() => handleSubjectSelect(subject)}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        border: `1px solid ${color}40`,
                                        position: 'relative' as const,
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.borderColor = color;
                                        e.currentTarget.style.background = '#f3f7ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.borderColor = `${color}40`;
                                        e.currentTarget.style.background = '#fff';
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
                                        marginBottom: '14px',
                                        paddingLeft: '8px'
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            background: color,
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            marginRight: '14px',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            📚
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '700',
                                            color: '#111827',
                                            margin: '0',
                                            lineHeight: '1.3'
                                        }}>
                                            {subject.nombre_materia}
                                        </h3>
                                    </div>
                                    
                                    <div style={{ paddingLeft: '8px' }}>
                                        <p style={{
                                            color: '#6b7280',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.4',
                                            margin: '0'
                                        }}>
                                            {subject.nombre_curso} - Paralelo {subject.paralelo}
                                        </p>
                                    </div>
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
