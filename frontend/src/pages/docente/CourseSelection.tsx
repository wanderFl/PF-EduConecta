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
                        <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>Cargando cursos...</p>
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
                            onClick={loadTeacherCourses}
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

                {!loading && !error && courses.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                        <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
                            No tiene cursos asignados. Contacte al administrador.
                        </p>
                    </div>
                )}

                {!loading && !error && courses.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        {courses.map((course) => {
                            const color = courseColors[course.nombre] || '#3498db';
                            return (
                                <div
                                    key={course.id_curso}
                                    onClick={() => handleCourseSelect(course)}
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
                                            fontSize: '0.9rem',
                                            marginRight: '1rem',
                                            boxShadow: `0 4px 15px ${color}30`,
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            {course.paralelo}
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.4rem',
                                            fontWeight: '700',
                                            color: '#2c3e50',
                                            margin: '0',
                                            lineHeight: '1.2'
                                        }}>
                                            {course.nombre}
                                        </h3>
                                    </div>
                                    
                                    <p style={{
                                        color: '#7f8c8d',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        margin: '0 0 0.5rem 0'
                                    }}>
                                        {course.nivel} - Paralelo {course.paralelo}
                                    </p>
                                    <p style={{
                                        color: '#3498db',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        margin: '0'
                                    }}>
                                        {course.cantidad_estudiantes} estudiantes
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

export default CourseSelection;