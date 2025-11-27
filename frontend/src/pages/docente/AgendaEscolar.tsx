import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import './AgendaEscolar.css';

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
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const loadTasks = async (courseId: string) => {
        setLoading(true);
        setError(null);
        try {
            const tasksData = await taskService.getTasksByCourse(courseId);
            setTasks(tasksData);
        } catch (err) {
            console.error('Error loading tasks:', err);
            setError('Error al cargar las tareas');
        } finally {
            setLoading(false);
        }
    };

    // Calcular estadísticas
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

        return {
            totalTasks,
            totalStudents: Math.round(totalStudents),
            totalSubmissions,
            totalGraded,
            avgSubmissionRate: avgSubmissionRate.toFixed(1)
        };
    };

    // Datos para gráfico de barras: Tareas por estado
    const getTasksStatusData = () => {
        const now = new Date();
        const upcoming = tasks.filter(t => new Date(t.due_date) > now).length;
        const overdue = tasks.filter(t => new Date(t.due_date) <= now).length;
        const completed = tasks.filter(t => {
            const allGraded = t.students.every(s => s.grade !== null && s.grade !== undefined);
            return allGraded && t.students.length > 0;
        }).length;

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
            <div className="agenda-container">
                <div className="loading-agenda">
                    <div className="spinner-agenda"></div>
                    <div style={{ fontSize: '1.125rem', color: 'white' }}>Cargando...</div>
                </div>
            </div>
        );
    }

    const stats = calculateStats();
    const urgentTasks = getUrgentTasks();

    return (
        <div className="agenda-container">
            <div className="agenda-content">
                {/* Header */}
                <div className="agenda-header">
                    <div className="agenda-header-content">
                        <div className="header-text">
                            <h1>📅 Agenda Escolar Digital</h1>
                            <p>Curso: {selectedCourse.name}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => navigate("/docente/tareas")}
                                className="btn-agenda btn-primary"
                                style={{ 
                                    backgroundColor: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ✨ Crear Nueva Tarea
                            </button>
                            <button
                                onClick={() => navigate("/docente/dashboard")}
                                className="btn-agenda btn-secondary"
                            >
                                ← Volver al Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert-agenda alert-warning">
                        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="loading-agenda">
                        <div className="spinner-agenda"></div>
                        <p style={{ fontSize: '1.125rem', color: '#667eea' }}>Cargando estadísticas...</p>
                    </div>
                ) : (
                    <>
                        {/* Estadísticas rápidas */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-icon">📚</div>
                                    <div className="stat-info">
                                        <h3>Total Tareas</h3>
                                    </div>
                                </div>
                                <p className="stat-value">{stats.totalTasks}</p>
                                <div className="stat-trend positive">
                                    <span>Tareas creadas</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-icon">👥</div>
                                    <div className="stat-info">
                                        <h3>Estudiantes</h3>
                                    </div>
                                </div>
                                <p className="stat-value">{stats.totalStudents}</p>
                                <div className="stat-trend">
                                    <span>Promedio por tarea</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-icon">📤</div>
                                    <div className="stat-info">
                                        <h3>Entregas</h3>
                                    </div>
                                </div>
                                <p className="stat-value">{stats.totalSubmissions}</p>
                                <div className="stat-trend positive">
                                    <span>{stats.avgSubmissionRate}% tasa de entrega</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-icon">✅</div>
                                    <div className="stat-info">
                                        <h3>Calificadas</h3>
                                    </div>
                                </div>
                                <p className="stat-value">{stats.totalGraded}</p>
                                <div className="stat-trend">
                                    <span>Trabajos evaluados</span>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos */}
                        <div className="charts-grid">
                            <div className="chart-card">
                                <div className="chart-card-header">
                                    <h2>
                                        <span className="chart-icon">📊</span>
                                        Estado de Tareas
                                    </h2>
                                </div>
                                <div className="chart-wrapper">
                                    <Bar data={getTasksStatusData()} options={chartOptions} />
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-card-header">
                                    <h2>
                                        <span className="chart-icon">🎯</span>
                                        Estado de Entregas
                                    </h2>
                                </div>
                                <div className="chart-wrapper">
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
                        <div className="chart-card" style={{ marginBottom: '2rem' }}>
                            <div className="chart-card-header">
                                <h2>
                                    <span className="chart-icon">📈</span>
                                    Rendimiento Promedio por Tarea
                                </h2>
                            </div>
                            <div className="chart-wrapper">
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
                        <div className="pending-tasks-section">
                            <div className="pending-tasks-header">
                                <h2>
                                    <span className="chart-icon">⚡</span>
                                    Tareas Próximas a Vencer
                                </h2>
                            </div>
                            
                            {urgentTasks.length > 0 ? (
                                <div className="tasks-list">
                                    {urgentTasks.map(task => {
                                        const submittedCount = task.students.filter(s => s.has_submission).length;
                                        const totalStudents = task.students.length;
                                        
                                        return (
                                            <div key={task.id} className="task-item">
                                                <div className="task-item-content">
                                                    <div className="task-item-title">{task.title}</div>
                                                    <div className="task-item-meta">
                                                        Vence: {new Date(task.due_date).toLocaleDateString('es-ES')} • 
                                                        Entregas: {submittedCount}/{totalStudents}
                                                    </div>
                                                </div>
                                                <span className={`task-item-badge ${getTaskBadge(task.due_date)}`}>
                                                    {formatDate(task.due_date)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state-agenda">
                                    <div className="empty-state-agenda-icon">✨</div>
                                    <h3>No hay tareas urgentes</h3>
                                    <p>Todas las tareas están bajo control</p>
                                </div>
                            )}
                        </div>

                        {tasks.length === 0 && (
                            <div className="alert-agenda alert-info">
                                <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                                <span>No hay tareas creadas para este curso. Las estadísticas aparecerán cuando crees tareas.</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AgendaEscolar;