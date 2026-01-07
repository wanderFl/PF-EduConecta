import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskService } from "../../services/tasks";
import type { Course } from "../../types";
import '../familia.css';

interface Task {
    id: string;
    title: string;
    instructions: string | null;
    due_date: string;
    max_points: number;
    subject_external_id: number;
    trimestre: number | null;
    aporte: number | null;
    file_reference: string | null;
    created_at: string;
}

interface EditingTask {
    id: string;
    title: string;
    instructions: string;
    due_date: string;
    max_points: number;
    trimestre: number | null;
    aporte: number | null;
    file_reference: string | null;
    newFile: File | null;
    removeFile: boolean;
}

const GestionarTareas: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<{ id_materia: number; nombre_materia: string } | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const courseData = localStorage.getItem('selectedCourseData');
        const subjectData = localStorage.getItem('selectedSubjectData');
        
        if (!courseData) {
            navigate('/docente');
            return;
        }
        
        try {
            const course = JSON.parse(courseData);
            setSelectedCourse(course);
            
            if (subjectData) {
                const subject = JSON.parse(subjectData);
                setSelectedSubject(subject);
            }
            
            loadTasks(course.id);
        } catch {
            navigate('/docente');
        }
    }, [navigate]);

    const loadTasks = async (courseId: string) => {
        setLoading(true);
        setError(null);
        try {
            const courseIdNum = courseId.replace(/\D/g, '');
            const response = await taskService.getTasksByCourse(courseIdNum);
            
            if (response.success && Array.isArray(response.tasks)) {
                setTasks(response.tasks);
            } else {
                setError('Error cargando las tareas del curso');
            }
        } catch (err) {
            console.error('Error loading tasks:', err);
            setError(err instanceof Error ? err.message : 'Error cargando las tareas');
        } finally {
            setLoading(false);
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTask({
            id: task.id,
            title: task.title,
            instructions: task.instructions || '',
            due_date: task.due_date.split('T')[0],
            max_points: task.max_points,
            trimestre: task.trimestre,
            aporte: task.aporte,
            file_reference: task.file_reference,
            newFile: null,
            removeFile: false
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTask) return;

        if (!editingTask.title || editingTask.max_points < 0 || editingTask.max_points > 10) {
            setError('Por favor, complete los campos correctamente (puntuación entre 0 y 10)');
            return;
        }

        setLoading(true);
        try {
            await taskService.updateTask(editingTask.id, {
                title: editingTask.title,
                instructions: editingTask.instructions,
                due_date: editingTask.due_date,
                max_points: editingTask.max_points,
                trimestre: editingTask.trimestre,
                aporte: editingTask.aporte,
                file: editingTask.newFile,
                removeFile: editingTask.removeFile
            });

            // Recargar tareas
            if (selectedCourse) {
                await loadTasks(selectedCourse.id);
            }

            setShowEditModal(false);
            setEditingTask(null);
            setError(null);
            setSuccessMessage('✅ Tarea editada correctamente');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error updating task:', err);
            setError(err instanceof Error ? err.message : 'Error actualizando la tarea');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        setLoading(true);
        try {
            await taskService.deleteTask(taskId);

            // Recargar tareas
            if (selectedCourse) {
                await loadTasks(selectedCourse.id);
            }

            setDeleteConfirm(null);
            setError(null);
        } catch (err) {
            console.error('Error deleting task:', err);
            setError(err instanceof Error ? err.message : 'Error eliminando la tarea');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleGoBack = () => {
        navigate('/docente/dashboard');
    };

    if (!selectedCourse) {
        return <div>Cargando...</div>;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f7f8fb',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
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
                        fontSize: '1.2rem'
                    }}>
                        📋
                    </div>
                    <div>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#fff'
                        }}>
                            Gestionar Tareas
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#d7e3ff',
                            marginTop: '2px'
                        }}>
                            Curso: {selectedCourse?.name} - Paralelo {(selectedCourse && 'paralelo' in selectedCourse ? String(selectedCourse['paralelo' as keyof typeof selectedCourse]) : 'A')}
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={handleGoBack}
                    style={{
                        background: '#fff',
                        color: '#1e4db7',
                        border: '1px solid #d7e3ff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                    ← Volver al Dashboard
                </button>
            </div>

            <div className="fam-body">
                <div className="fam-main">
                    {/* Breadcrumb */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        color: '#666'
                    }}>
                        Gestionar Tareas → {selectedCourse?.name}
                    </div>

                    {/* Título y materia */}
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '15px',
                        marginBottom: '1.5rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h1 style={{
                            color: '#1e4db7',
                            fontSize: '2rem',
                            fontWeight: '700',
                            margin: '0 0 0.5rem 0'
                        }}>
                            Gestionar Tareas
                        </h1>
                        <p style={{
                            color: '#666',
                            fontSize: '1rem',
                            margin: '0.25rem 0'
                        }}>
                            {selectedCourse?.name} - {selectedCourse?.description}
                        </p>
                        {selectedSubject && (
                            <p style={{
                                color: '#1e4db7',
                                fontSize: '1rem',
                                fontWeight: '600',
                                margin: '0.5rem 0 0 0'
                            }}>
                                📖 Materia: {selectedSubject.nombre_materia}
                            </p>
                        )}
                    </div>
                    {/* Mensajes de error y éxito */}
                {error && (
                    <div style={{
                        background: '#fee',
                        border: '2px solid #fcc',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#c00'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#c00',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                padding: '0',
                                width: '24px',
                                height: '24px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div style={{
                        background: '#d4edda',
                        border: '2px solid #c3e6cb',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#155724'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>✓</span>
                            <span>{successMessage}</span>
                        </div>
                        <button 
                            onClick={() => setSuccessMessage(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#155724',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                padding: '0',
                                width: '24px',
                                height: '24px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {loading && (
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
                        <p style={{ color: '#666', margin: 0 }}>Cargando tareas...</p>
                    </div>
                )}

                {!loading && tasks.length === 0 && (
                    <div style={{
                        background: 'white',
                        padding: '3rem',
                        borderRadius: '15px',
                        textAlign: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '1rem',
                            opacity: 0.5
                        }}>
                            📋
                        </div>
                        <h3 style={{
                            color: '#2c3e50',
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                        }}>
                            No hay tareas creadas
                        </h3>
                        <p style={{
                            color: '#666',
                            marginBottom: '1.5rem'
                        }}>
                            Aún no has creado tareas para este curso y materia.
                        </p>
                        <button 
                            onClick={() => navigate('/docente/tareas')}
                            style={{
                                background: '#1e4db7',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(30, 77, 183, 0.3)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Crear nueva tarea
                        </button>
                    </div>
                )}

                {!loading && tasks.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {tasks.map((task) => (
                            <div 
                                key={task.id} 
                                style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '15px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                    border: '1px solid #e5e7eb',
                                    borderLeft: `4px solid ${selectedCourse.color || '#1e4db7'}`,
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                                }}
                            >
                                {/* Título y acciones */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '1rem'
                                }}>
                                    <h3 style={{
                                        color: '#1e4db7',
                                        fontSize: '1.25rem',
                                        fontWeight: '700',
                                        margin: 0,
                                        flex: 1
                                    }}>
                                        {task.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                        <button 
                                            onClick={() => handleEditTask(task)}
                                            style={{
                                                background: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#2980b9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#3498db'}
                                            title="Editar tarea"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm(task.id)}
                                            style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c'}
                                            title="Eliminar tarea"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                </div>

                                {/* Instrucciones */}
                                {task.instructions && (
                                    <p style={{
                                        color: '#666',
                                        fontSize: '0.95rem',
                                        marginBottom: '1rem',
                                        lineHeight: '1.5'
                                    }}>
                                        {task.instructions}
                                    </p>
                                )}
                                
                                {/* Detalles */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid #e5e7eb'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: '#666',
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>📅</span>
                                        <span><strong>Vencimiento:</strong> {formatDate(task.due_date)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: '#666',
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>⭐</span>
                                        <span><strong>Puntuación:</strong> {task.max_points}/10</span>
                                    </div>
                                    {task.trimestre && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#666',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>📊</span>
                                            <span><strong>Trimestre:</strong> {task.trimestre}</span>
                                        </div>
                                    )}
                                    {task.aporte && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#666',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>✅</span>
                                            <span><strong>Aporte:</strong> {task.aporte}</span>
                                        </div>
                                    )}
                                    {task.file_reference && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#666',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>📎</span>
                                            <span>Archivo adjunto</span>
                                        </div>
                                    )}
                                </div>

                                {/* Modal de confirmación de eliminación */}
                                {deleteConfirm === task.id && (
                                    <div style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1000
                                    }}>
                                        <div style={{
                                            background: 'white',
                                            padding: '2rem',
                                            borderRadius: '15px',
                                            maxWidth: '450px',
                                            width: '90%',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                                        }}>
                                            <h3 style={{
                                                color: '#e74c3c',
                                                fontSize: '1.5rem',
                                                fontWeight: '700',
                                                marginBottom: '1rem'
                                            }}>
                                                ¿Eliminar tarea?
                                            </h3>
                                            <p style={{
                                                color: '#666',
                                                marginBottom: '1.5rem',
                                                lineHeight: '1.6'
                                            }}>
                                                Esta acción no se puede deshacer. Se eliminarán todas las entregas y calificaciones asociadas.
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                justifyContent: 'flex-end'
                                            }}>
                                                <button 
                                                    onClick={() => setDeleteConfirm(null)}
                                                    style={{
                                                        background: '#95a5a6',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.75rem 1.5rem',
                                                        borderRadius: '8px',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#7f8c8d'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#95a5a6'}
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    style={{
                                                        background: '#e74c3c',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.75rem 1.5rem',
                                                        borderRadius: '8px',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c'}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

            {/* Modal de edición */}
            {showEditModal && editingTask && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '15px',
                        maxWidth: '700px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        {/* Header del modal */}
                        <div style={{
                            background: '#1e4db7',
                            color: 'white',
                            padding: '1.5rem',
                            borderRadius: '15px 15px 0 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: '700'
                            }}>
                                Editar Tarea
                            </h2>
                            <button 
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTask(null);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                ×
                            </button>
                        </div>

                        {/* Body del modal */}
                        <div style={{ padding: '2rem' }}>
                            {/* Título */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#2c3e50',
                                    fontSize: '0.95rem'
                                }}>
                                    Título de la tarea *
                                </label>
                                <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                    placeholder="Título de la tarea"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e4db7'}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                />
                            </div>

                            {/* Instrucciones */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#2c3e50',
                                    fontSize: '0.95rem'
                                }}>
                                    Instrucciones
                                </label>
                                <textarea
                                    value={editingTask.instructions}
                                    onChange={(e) => setEditingTask({...editingTask, instructions: e.target.value})}
                                    placeholder="Instrucciones detalladas"
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e1e5e9',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        resize: 'vertical',
                                        transition: 'border-color 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e4db7'}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                />
                            </div>

                            {/* Fecha y puntuación */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontWeight: '600',
                                        marginBottom: '0.5rem',
                                        color: '#2c3e50',
                                        fontSize: '0.95rem'
                                    }}>
                                        Fecha de vencimiento *
                                    </label>
                                    <input
                                        type="date"
                                        value={editingTask.due_date}
                                        onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1e4db7'}
                                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontWeight: '600',
                                        marginBottom: '0.5rem',
                                        color: '#2c3e50',
                                        fontSize: '0.95rem'
                                    }}>
                                        Puntuación máxima *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={editingTask.max_points}
                                        onChange={(e) => setEditingTask({...editingTask, max_points: parseFloat(e.target.value)})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1e4db7'}
                                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                    />
                                </div>
                            </div>

                            {/* Trimestre y aporte */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontWeight: '600',
                                        marginBottom: '0.5rem',
                                        color: '#2c3e50',
                                        fontSize: '0.95rem'
                                    }}>
                                        Trimestre
                                    </label>
                                    <select
                                        value={editingTask.trimestre || ''}
                                        onChange={(e) => setEditingTask({...editingTask, trimestre: e.target.value ? parseInt(e.target.value) : null})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1e4db7'}
                                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                    >
                                        <option value="">Seleccionar trimestre</option>
                                        <option value="1">Primer Trimestre</option>
                                        <option value="2">Segundo Trimestre</option>
                                        <option value="3">Tercer Trimestre</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontWeight: '600',
                                        marginBottom: '0.5rem',
                                        color: '#2c3e50',
                                        fontSize: '0.95rem'
                                    }}>
                                        Aporte
                                    </label>
                                    <select
                                        value={editingTask.aporte || ''}
                                        onChange={(e) => setEditingTask({...editingTask, aporte: e.target.value ? parseInt(e.target.value) : null})}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1e4db7'}
                                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                                    >
                                        <option value="">Seleccionar aporte</option>
                                        <option value="1">Aporte 1</option>
                                        <option value="2">Aporte 2</option>
                                    </select>
                                </div>
                            </div>

                            {/* Archivo adjunto */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#2c3e50',
                                    fontSize: '0.95rem'
                                }}>
                                    Archivo Adjunto
                                </label>
                                {editingTask.file_reference && !editingTask.removeFile && !editingTask.newFile && (
                                    <div style={{
                                        background: '#f8f9fa',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📄</span>
                                            <span style={{ fontSize: '0.9rem' }}>
                                                Archivo actual: {editingTask.file_reference.split('/').pop()}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask({...editingTask, removeFile: true})}
                                            style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                )}
                                {editingTask.removeFile && (
                                    <div style={{
                                        background: '#fff3cd',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #ffc107',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                                            <span style={{ fontSize: '0.9rem' }}>
                                                El archivo será eliminado al guardar
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask({...editingTask, removeFile: false})}
                                            style={{
                                                background: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Deshacer
                                        </button>
                                    </div>
                                )}
                                {editingTask.newFile && (
                                    <div style={{
                                        background: '#d4edda',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #c3e6cb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📄</span>
                                            <span style={{ fontSize: '0.9rem' }}>
                                                Nuevo archivo: {editingTask.newFile.name}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask({...editingTask, newFile: null})}
                                            style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                )}
                                {!editingTask.newFile && (
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setEditingTask({...editingTask, newFile: file, removeFile: false});
                                            }
                                        }}
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e5e9',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            cursor: 'pointer'
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer del modal */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'flex-end'
                        }}>
                            <button 
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTask(null);
                                }}
                                style={{
                                    background: '#95a5a6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#7f8c8d'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#95a5a6'}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={loading}
                                style={{
                                    background: loading ? '#95a5a6' : '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#229954')}
                                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#27ae60')}
                            >
                                {loading ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionarTareas;
