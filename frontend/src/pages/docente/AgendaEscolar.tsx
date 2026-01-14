import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { taskService } from "../../services/tasks";
import type { Course, Task } from "../../types";
import '../familia.css';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AgendaEscolar: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const teacherName = user?.email?.split('@')[0] || 'Docente';

    useEffect(() => {
        const courseData = localStorage.getItem('selectedCourseData');
        if (!courseData) {
            navigate('/docente');
            return;
        }
        
        try {
            const course = JSON.parse(courseData);
            setSelectedCourse(course);
            loadTasks(course.id);
        } catch {
            navigate('/docente');
        }
    }, [navigate]);

    // Efecto para recargar tareas cuando cambia el curso en localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const courseData = localStorage.getItem('selectedCourseData');
            if (courseData) {
                try {
                    const course = JSON.parse(courseData);
                    if (selectedCourse?.id !== course.id) {
                        setSelectedCourse(course);
                        loadTasks(course.id);
                    }
                } catch (err) {
                    console.error('Error parsing course data:', err);
                }
            }
        };

        // Escuchar cambios en localStorage
        window.addEventListener('storage', handleStorageChange);
        
        // También verificar periódicamente (para cambios en la misma pestaña)
        const interval = setInterval(() => {
            const courseData = localStorage.getItem('selectedCourseData');
            if (courseData) {
                try {
                    const course = JSON.parse(courseData);
                    if (selectedCourse?.id !== course.id) {
                        setSelectedCourse(course);
                        loadTasks(course.id);
                    }
                } catch (err) {
                    console.error('Error parsing course data:', err);
                }
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [selectedCourse]);

    const loadTasks = async (courseId: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log('📚 Cargando tareas para curso:', courseId);
            const tasksData = await taskService.getTasksByCourse(courseId);
            console.log('✅ Tareas cargadas del curso', courseId, ':', tasksData.length, 'tarea(s)');
            setTasks(tasksData);
        } catch (err) {
            console.error('Error loading tasks:', err);
            setError('Error al cargar las tareas');
        } finally {
            setLoading(false);
        }
    };

    // Calcular estadísticas basadas SOLO en tareas del curso actual
    const calculateStats = () => {
        const totalTasks = tasks.length;
        const totalStudents = tasks.reduce((sum, task) => sum + task.students.length, 0) / (totalTasks || 1);
        const totalSubmissions = tasks.reduce((sum, task) => 
            sum + task.students.filter(s => s.has_submission).length, 0
        );
        const totalGraded = tasks.reduce((sum, task) => 
            sum + task.students.filter(s => s.grade !== null && s.grade !== undefined).length, 0
        );
        const avgSubmissionRate = totalTasks > 0 
            ? (totalSubmissions / (totalTasks * totalStudents)) * 100 
            : 0;

        console.log('📊 Estadísticas del curso', selectedCourse?.name, ':', {
            totalTasks,
            totalStudents: Math.round(totalStudents),
            totalSubmissions,
            totalGraded
        });

        return {
            totalTasks,
            totalStudents: Math.round(totalStudents),
            totalSubmissions,
            totalGraded,
            avgSubmissionRate: avgSubmissionRate.toFixed(1)
        };
    };

    // Datos para gráfico de barras: Tareas por estado (SOLO del curso actual)
    const getTasksStatusData = () => {
        const now = new Date();
        const upcoming = tasks.filter(t => new Date(t.due_date) > now).length;
        const overdue = tasks.filter(t => new Date(t.due_date) <= now).length;
        const completed = tasks.filter(t => {
            const allGraded = t.students.every(s => s.grade !== null && s.grade !== undefined);
            return allGraded && t.students.length > 0;
        }).length;

        console.log('📈 Estado de tareas del curso:', {
            próximas: upcoming,
            vencidas: overdue,
            completadas: completed
        });

        return {
            labels: ['Próximas', 'Vencidas', 'Completadas'],
            datasets: [{
                label: 'Cantidad de Tareas',
                data: [upcoming, overdue, completed],
                backgroundColor: [
                    'rgba(81, 207, 102, 0.8)',
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(76, 110, 245, 0.8)',
                ],
                borderColor: [
                    'rgb(81, 207, 102)',
                    'rgb(255, 107, 107)',
                    'rgb(76, 110, 245)',
                ],
                borderWidth: 2,
                borderRadius: 8,
            }]
        };
    };

    // Datos para gráfico circular: Estado de entregas
    const getSubmissionsData = () => {
        const stats = calculateStats();
        const totalPossible = stats.totalTasks * stats.totalStudents;
        const submitted = stats.totalSubmissions;
        const pending = totalPossible - submitted;

        return {
            labels: ['Entregadas', 'Pendientes'],
            datasets: [{
                data: [submitted, pending],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(226, 232, 240, 0.8)',
                ],
                borderColor: [
                    'rgb(102, 126, 234)',
                    'rgb(226, 232, 240)',
                ],
                borderWidth: 2,
            }]
        };
    };

    // Datos para gráfico de líneas: Rendimiento promedio
    const getPerformanceData = () => {
        const tasksWithGrades = tasks.filter(t => 
            t.students.some(s => s.grade !== null && s.grade !== undefined)
        );

        const labels = tasksWithGrades.map(t => t.title.substring(0, 15) + '...');
        const avgGrades = tasksWithGrades.map(t => {
            const grades = t.students
                .filter(s => s.grade !== null && s.grade !== undefined)
                .map(s => s.grade as number);
            return grades.length > 0 
                ? grades.reduce((sum, g) => sum + g, 0) / grades.length 
                : 0;
        });

        return {
            labels: labels.length > 0 ? labels : ['Sin datos'],
            datasets: [{
                label: 'Promedio de Calificaciones',
                data: avgGrades.length > 0 ? avgGrades : [0],
                borderColor: 'rgb(118, 75, 162)',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: 'rgb(118, 75, 162)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }]
        };
    };

    // Obtener tareas urgentes (vencen en menos de 3 días)
    const getUrgentTasks = () => {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        return tasks
            .filter(t => {
                const dueDate = new Date(t.due_date);
                return dueDate > now && dueDate <= threeDaysFromNow;
            })
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (days < 0) return 'Vencida';
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Mañana';
        return `En ${days} días`;
    };

    const getTaskBadge = (dueDate: string) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (days <= 1) return 'badge-urgent';
        if (days <= 3) return 'badge-soon';
        return 'badge-normal';
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                        weight: 'bold' as const
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8,
                titleFont: {
                    size: 14,
                    weight: 'bold' as const
                },
                bodyFont: {
                    size: 13
                }
            }
        }
    };

    if (!selectedCourse) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#f7f8fb'
            }}>
                <div style={{
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #1e4db7',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{ fontSize: '1.125rem', color: '#666' }}>Cargando...</div>
                </div>
            </div>
        );
    }

    const stats = calculateStats();
    const urgentTasks = getUrgentTasks();

    return (
        <div className="fam-layout">
            {/* Header */}
            <div className="fam-header">
                <div className="fam-header-content">
                    <button
                        onClick={() => navigate("/docente/dashboard")}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        ← Volver al Dashboard
                    </button>
                    <div className="fam-user-info">
                        <h1 className="fam-user-name">{teacherName}</h1>
                        <p className="fam-user-subtitle">
                            Dashboard de Agenda Escolar
                        </p>
                    </div>
                </div>
            </div>

            <div className="fam-body">
                <div className="fam-main">
                    {/* Título y Breadcrumb */}
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '15px',
                        marginBottom: '1.5rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div>
                                <h1 style={{
                                    color: '#1e4db7',
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    📅 Dashboard de Agenda Escolar
                                </h1>
                                <p style={{
                                    color: '#666',
                                    fontSize: '1rem',
                                    margin: 0
                                }}>
                                    DESDE: <input type="date" style={{
                                        padding: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        marginRight: '1rem'
                                    }} />
                                    HASTA: <input type="date" style={{
                                        padding: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px'
                                    }} />
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/docente/tareas")}
                                style={{
                                    background: '#1e4db7',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(30, 77, 183, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 77, 183, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(30, 77, 183, 0.3)';
                                }}
                            >
                                ✨ Crear Nueva Tarea
                            </button>
                        </div>
                    </div>

                    {/* Mensajes */}
                {error && (
                    <div style={{
                        background: '#fee',
                        border: '2px solid #fcc',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#c00'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div style={{
                        background: 'white',
                        padding: '3rem',
                        borderRadius: '15px',
                        textAlign: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #1e4db7',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#666', margin: 0 }}>Cargando estadísticas...</p>
                    </div>
                ) : (
                    <>
                        {/* Estadísticas rápidas */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Total de Tareas */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(30, 77, 183, 0.1)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📚
                                    </div>
                                    <h3 style={{ color: '#666', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>
                                        TOTAL DE TAREAS
                                    </h3>
                                </div>
                                <p style={{ color: '#1e4db7', fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0' }}>
                                    {stats.totalTasks}
                                </p>
                                <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0 }}>
                                    Tareas creadas
                                </p>
                            </div>

                            {/* Vencidas */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        ⏰
                                    </div>
                                    <h3 style={{ color: '#666', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>
                                        VENCIDAS
                                    </h3>
                                </div>
                                <p style={{ color: '#ef4444', fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0' }}>
                                    {getTasksStatusData().datasets[0].data[1]}
                                </p>
                                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                                    Tareas vencidas
                                </p>
                            </div>

                            {/* Próximas */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📅
                                    </div>
                                    <h3 style={{ color: '#666', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>
                                        PRÓXIMAS (7 DÍAS)
                                    </h3>
                                </div>
                                <p style={{ color: '#f59e0b', fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0' }}>
                                    {urgentTasks.length}
                                </p>
                                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                                    Tareas próximas
                                </p>
                            </div>

                            {/* Pendientes de calificar */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        ✅
                                    </div>
                                    <h3 style={{ color: '#666', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>
                                        PENDIENTES DE CALIFICAR
                                    </h3>
                                </div>
                                <p style={{ color: '#10b981', fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0' }}>
                                    {stats.totalSubmissions - stats.totalGraded}
                                </p>
                                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                                    Entregas sin calificar
                                </p>
                            </div>
                        </div>

                        {/* Gráficos */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Gráfico de estado de tareas */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <h2 style={{
                                    color: '#1e4db7',
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>📊</span>
                                    Estado de Tareas
                                </h2>
                                <div style={{ height: '300px' }}>
                                    <Bar data={getTasksStatusData()} options={chartOptions} />
                                </div>
                            </div>

                            {/* Gráfico de estado de entregas */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <h2 style={{
                                    color: '#1e4db7',
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>🎯</span>
                                    Estado de Entregas
                                </h2>
                                <div style={{ height: '300px' }}>
                                    <Doughnut 
                                        data={getSubmissionsData()} 
                                        options={{
                                            ...chartOptions,
                                            cutout: '65%'
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gráfico de rendimiento - ancho completo */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '15px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            border: '1px solid #e5e7eb',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                color: '#1e4db7',
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span>📈</span>
                                Rendimiento Promedio por Tarea
                            </h2>
                            <div style={{ height: '300px' }}>
                                <Line 
                                    data={getPerformanceData()} 
                                    options={{
                                        ...chartOptions,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                max: 10,
                                                ticks: {
                                                    stepSize: 1
                                                }
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>

                        {/* Tareas urgentes */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '15px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            border: '1px solid #e5e7eb',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                color: '#1e4db7',
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span>⚡</span>
                                Tareas Próximas a Vencer
                            </h2>
                            
                            {urgentTasks.length > 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    {urgentTasks.map(task => {
                                        const submittedCount = task.students.filter(s => s.has_submission).length;
                                        const totalStudents = task.students.length;
                                        const daysRemaining = formatDate(task.due_date);
                                        
                                        return (
                                            <div 
                                                key={task.id}
                                                style={{
                                                    padding: '1rem',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.3s ease',
                                                    background: daysRemaining === 'Hoy' ? '#fef3c7' : daysRemaining === 'Mañana' ? '#fed7aa' : '#fff'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(5px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div>
                                                    <div style={{
                                                        color: '#1e4db7',
                                                        fontWeight: '600',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {task.title}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: '#666'
                                                    }}>
                                                        Vence: {new Date(task.due_date).toLocaleDateString('es-ES')} • 
                                                        Entregas: {submittedCount}/{totalStudents}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    background: daysRemaining === 'Hoy' || daysRemaining === 'Mañana' ? '#ef4444' : '#f59e0b',
                                                    color: 'white'
                                                }}>
                                                    {daysRemaining}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: '#666'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>✨</div>
                                    <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>No hay tareas urgentes</h3>
                                    <p style={{ margin: 0 }}>Todas las tareas están bajo control</p>
                                </div>
                            )}
                        </div>

                        {tasks.length === 0 && (
                            <div style={{
                                background: '#dbeafe',
                                border: '2px solid #93c5fd',
                                padding: '1rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#1e40af'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                                <span>No hay tareas creadas para este curso. Las estadísticas aparecerán cuando crees tareas.</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        </div>
    );
};

export default AgendaEscolar;