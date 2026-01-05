// src/pages/DashboardDocente.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { Course } from "../types";
import { taskService } from "../services/tasks";
import { listTeacherConversations, type TeacherConversation } from "../services/communications";
import "./DashboardDocente.css";

interface TaskSubmission {
    id_estudiante: number;
    nombre_estudiante: string;
    estado: string;
    calificacion: number | null;
}

interface TaskWithSubmissions {
    id_tarea: string;
    nombre_tarea: string;
    estudiantes: TaskSubmission[];
}

export const DashboardDocente: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [recentMessages, setRecentMessages] = useState<TeacherConversation[]>([]);
    const [pendingGrades, setPendingGrades] = useState<TaskSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const courseData = localStorage.getItem('selectedCourseData');
        if (!courseData) {
            navigate('/docente');
            return;
        }
        
        try {
            const course = JSON.parse(courseData);
            setSelectedCourse(course);
            loadDashboardData(course);
        } catch (error) {
            console.error('Error parsing course data:', error);
            navigate('/docente');
        }
    }, [navigate]);

    const loadDashboardData = async (course: Course) => {
        setLoading(true);
        try {
            // Cargar mensajes recientes de comunicados
            const conversationsResponse = await listTeacherConversations();
            // El backend puede devolver un objeto con { conversations, warning } o un array directamente
            let conversations: TeacherConversation[] = [];
            if (Array.isArray(conversationsResponse)) {
                conversations = conversationsResponse;
            } else {
                conversations = conversationsResponse.conversations || [];
            }
            setRecentMessages(conversations.slice(0, 3)); // Solo los 3 más recientes

            // Cargar tareas pendientes de calificar
            const courseIdNum = course.id.replace(/\D/g, ''); // Extraer solo números del ID
            const tasksResponse = await taskService.getTasksByCourse(courseIdNum);
            
            // Obtener estudiantes pendientes de calificar
            const pending: TaskSubmission[] = [];
            
            // El backend devuelve { success: true, tasks: [...] }
            const tasksData = tasksResponse?.tasks || [];
            
            if (Array.isArray(tasksData)) {
                tasksData.forEach((task: any) => {
                    if (task.students && Array.isArray(task.students)) {
                        // Filtrar estudiantes que han entregado pero no están calificados
                        const ungraded = task.students.filter(
                            (student: any) => 
                                student.has_submission && 
                                (student.grade === null || student.grade === undefined)
                        );
                        ungraded.forEach((student: any) => {
                            pending.push({
                                id_estudiante: student.id,
                                nombre_estudiante: student.nombre_completo || `Estudiante ${student.id}`,
                                estado: `${task.title} - Pendiente de calificar`,
                                calificacion: null
                            });
                        });
                    }
                });
            }
            
            console.log('📚 Tareas pendientes de calificar:', pending);
            setPendingGrades(pending.slice(0, 3)); // Solo los 3 primeros
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

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
        },
        {
            title: "Gestionar Tareas",
            description: "Ver, editar y eliminar tareas creadas para este curso",
            path: "/docente/gestionar-tareas",
            icon: "✏️"
        }
    ];

    // Eventos importantes dinámicos (mensajes recientes)
    const eventosImportantes = loading 
        ? [{ title: "Cargando...", description: "Obteniendo información" }]
        : recentMessages.length > 0
            ? recentMessages.map(conv => ({
                title: `Mensaje de ${conv.student_name}`,
                description: conv.lastMessagePreview || "Nueva conversación"
            }))
            : [{ title: "Sin mensajes", description: "No hay comunicados recientes" }];

    // Tareas pendientes dinámicas
    const tareasEntregadas = loading
        ? [{ title: "Cargando...", description: "Obteniendo información" }]
        : pendingGrades.length > 0
            ? pendingGrades.map(grade => ({
                title: grade.nombre_estudiante,
                description: grade.estado
            }))
            : [{ title: "Sin tareas pendientes", description: "No hay entregas por calificar" }];

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