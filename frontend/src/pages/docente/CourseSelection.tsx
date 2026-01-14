import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import teacherService, { type TeacherCourse } from "../../services/teachers";

const CourseSelection: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState<TeacherCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Colores para los cursos
    const courseColors: { [key: string]: string } = {
        'Octavo EGB': '#3498db',
        'Noveno EGB': '#e74c3c',
        'Décimo EGB': '#f39c12',
        'Primero BGU': '#9b59b6',
        'Segundo BGU': '#1abc9c',
        'Tercero BGU': '#34495e'
    };

    useEffect(() => {
        loadTeacherCourses();
    }, []);

    const loadTeacherCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            // Intentar obtener el teacher_external_id del usuario (contexto o localStorage)
            let teacherExternalId = user?.external_id;
            
            // Si no está en el contexto, intentar desde localStorage
            if (!teacherExternalId) {
                const userStr = localStorage.getItem('edu_user');
                if (userStr) {
                    try {
                        const userData = JSON.parse(userStr);
                        teacherExternalId = userData.external_id;
                    } catch (e) {
                        console.error('Error parsing user data from localStorage:', e);
                    }
                }
            }
            
            if (!teacherExternalId) {
                setError('No se encontró el ID del docente. Por favor, cierre sesión e inicie nuevamente.');
                console.error('Missing external_id in user:', user);
                return;
            }

            console.log('Loading courses for teacher:', teacherExternalId);
            const coursesData = await teacherService.getTeacherCourses(parseInt(teacherExternalId));
            setCourses(coursesData);
        } catch (err) {
            console.error('Error loading teacher courses:', err);
            setError('Error al cargar los cursos. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = (course: TeacherCourse) => {
        // Guardar el curso seleccionado en localStorage
        localStorage.setItem('selectedCourse', course.id_curso.toString());
        localStorage.setItem('selectedCourseData', JSON.stringify({
            id: course.id_curso.toString(),
            name: course.nombre,
            description: `${course.nivel} - Paralelo ${course.paralelo}`,
            nivel: course.nivel,
            paralelo: course.paralelo,
            ano_lectivo: course.ano_lectivo,
            cantidad_estudiantes: course.cantidad_estudiantes
        }));
        
        // Navegar a selección de materias
        navigate('/docente/subjects');
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#fff',
                        color: '#1e4db7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1.1rem'
                    }}>
                        {user?.email?.charAt(0).toUpperCase() || 'D'}
                    </div>
                    <div>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#fff'
                        }}>
                            Seleccionar Curso
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#d7e3ff',
                            marginTop: '2px'
                        }}>
                            Bienvenido/a {user?.email}
                        </div>
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
                        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>Cargando cursos...</p>
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
                            onClick={loadTeacherCourses}
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

                {!loading && !error && courses.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                            No tiene cursos asignados. Contacte al administrador.
                        </p>
                    </div>
                )}

                {!loading && !error && courses.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {courses.map((course) => {
                            const color = courseColors[course.nombre] || '#3498db';
                            return (
                                <div
                                    key={course.id_curso}
                                    onClick={() => handleCourseSelect(course)}
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
                                            fontSize: '1.2rem',
                                            marginRight: '14px',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            {course.paralelo}
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '700',
                                            color: '#111827',
                                            margin: '0',
                                            lineHeight: '1.3'
                                        }}>
                                            {course.nombre}
                                        </h3>
                                    </div>
                                    
                                    <div style={{ paddingLeft: '8px' }}>
                                        <p style={{
                                            color: '#6b7280',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.4',
                                            margin: '0 0 8px 0'
                                        }}>
                                            {course.nivel} - Paralelo {course.paralelo}
                                        </p>
                                        <p style={{
                                            color: '#1e4db7',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            margin: '0'
                                        }}>
                                            {course.cantidad_estudiantes} estudiantes
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

export default CourseSelection;