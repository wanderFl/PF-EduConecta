import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { taskService } from "../../services/tasks";
import type { Course } from "../../types";
import './GestionarTareas.css';

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
    const { logout } = useAuth();
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
        <div className="gestionar-tareas-container">
            <div className="header-section">
                <div className="header-content">
                    <button onClick={handleGoBack} className="back-button">
                        <i className="fas fa-arrow-left"></i>
                        Volver al Dashboard
                    </button>
                    <div className="header-info">
                        <h1>Gestionar Tareas</h1>
                        <p className="course-info">{selectedCourse.name} - {selectedCourse.description}</p>
                        {selectedSubject && (
                            <p className="subject-info">Materia: {selectedSubject.nombre_materia}</p>
                        )}
                    </div>
                    <button onClick={logout} className="logout-button">
                        <i className="fas fa-sign-out-alt"></i>
                        Cerrar sesión
                    </button>
                </div>
            </div>

            <div className="main-content">
                {error && (
                    <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                        <button onClick={() => setError(null)} className="close-error">×</button>
                    </div>
                )}

                {successMessage && (
                    <div className="success-message">
                        <i className="fas fa-check-circle"></i>
                        {successMessage}
                        <button onClick={() => setSuccessMessage(null)} className="close-success">×</button>
                    </div>
                )}

                {loading && (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Cargando tareas...</p>
                    </div>
                )}

                {!loading && tasks.length === 0 && (
                    <div className="empty-state">
                        <i className="fas fa-tasks"></i>
                        <h3>No hay tareas creadas</h3>
                        <p>Aún no has creado tareas para este curso y materia.</p>
                        <button onClick={() => navigate('/docente/tareas')} className="create-task-button">
                            Crear nueva tarea
                        </button>
                    </div>
                )}

                {!loading && tasks.length > 0 && (
                    <div className="tasks-grid">
                        {tasks.map((task) => (
                            <div 
                                key={task.id} 
                                className="task-card"
                                style={{ borderLeftColor: selectedCourse.color }}
                            >
                                <div className="task-header">
                                    <h3>{task.title}</h3>
                                    <div className="task-actions">
                                        <button 
                                            onClick={() => handleEditTask(task)}
                                            className="edit-button"
                                            title="Editar tarea"
                                        >
                                            <i className="fas fa-edit"></i>
                                            <span>Editar</span>
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm(task.id)}
                                            className="delete-button"
                                            title="Eliminar tarea"
                                        >
                                            <i className="fas fa-trash"></i>
                                            <span>Eliminar</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="task-body">
                                    {task.instructions && (
                                        <p className="task-instructions">{task.instructions}</p>
                                    )}
                                    
                                    <div className="task-details">
                                        <div className="detail-item">
                                            <i className="fas fa-calendar"></i>
                                            <span>Vencimiento: {formatDate(task.due_date)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="fas fa-star"></i>
                                            <span>Puntuación: {task.max_points}/10</span>
                                        </div>
                                        {task.trimestre && (
                                            <div className="detail-item">
                                                <i className="fas fa-calendar-alt"></i>
                                                <span>Trimestre: {task.trimestre}</span>
                                            </div>
                                        )}
                                        {task.aporte && (
                                            <div className="detail-item">
                                                <i className="fas fa-check-circle"></i>
                                                <span>Aporte {task.aporte}</span>
                                            </div>
                                        )}
                                        {task.file_reference && (
                                            <div className="detail-item">
                                                <i className="fas fa-paperclip"></i>
                                                <span>Archivo adjunto</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modal de confirmación de eliminación */}
                                {deleteConfirm === task.id && (
                                    <div className="delete-confirm-overlay">
                                        <div className="delete-confirm-modal">
                                            <h3>¿Eliminar tarea?</h3>
                                            <p>Esta acción no se puede deshacer. Se eliminarán todas las entregas y calificaciones asociadas.</p>
                                            <div className="confirm-actions">
                                                <button 
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="cancel-button"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="confirm-delete-button"
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

            {/* Modal de edición */}
            {showEditModal && editingTask && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Editar Tarea</h2>
                            <button 
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTask(null);
                                }}
                                className="close-modal"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Título de la tarea *</label>
                                <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                    placeholder="Título de la tarea"
                                />
                            </div>

                            <div className="form-group">
                                <label>Instrucciones</label>
                                <textarea
                                    value={editingTask.instructions}
                                    onChange={(e) => setEditingTask({...editingTask, instructions: e.target.value})}
                                    placeholder="Instrucciones detalladas"
                                    rows={4}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha de vencimiento *</label>
                                    <input
                                        type="date"
                                        value={editingTask.due_date}
                                        onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Puntuación máxima *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={editingTask.max_points}
                                        onChange={(e) => setEditingTask({...editingTask, max_points: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Trimestre</label>
                                    <select
                                        value={editingTask.trimestre || ''}
                                        onChange={(e) => setEditingTask({...editingTask, trimestre: e.target.value ? parseInt(e.target.value) : null})}
                                    >
                                        <option value="">Seleccionar trimestre</option>
                                        <option value="1">Primer Trimestre</option>
                                        <option value="2">Segundo Trimestre</option>
                                        <option value="3">Tercer Trimestre</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Aporte</label>
                                    <select
                                        value={editingTask.aporte || ''}
                                        onChange={(e) => setEditingTask({...editingTask, aporte: e.target.value ? parseInt(e.target.value) : null})}
                                    >
                                        <option value="">Seleccionar aporte</option>
                                        <option value="1">Aporte 1</option>
                                        <option value="2">Aporte 2</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Archivo Adjunto</label>
                                {editingTask.file_reference && !editingTask.removeFile && !editingTask.newFile && (
                                    <div className="current-file">
                                        <i className="fas fa-file"></i>
                                        <span>Archivo actual: {editingTask.file_reference.split('/').pop()}</span>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask({...editingTask, removeFile: true})}
                                            className="remove-file-btn"
                                        >
                                            <i className="fas fa-times"></i> Quitar archivo
                                        </button>
                                    </div>
                                )}
                                {editingTask.removeFile && (
                                    <div className="file-removed-notice">
                                        <i className="fas fa-info-circle"></i>
                                        <span>El archivo será eliminado al guardar</span>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask({...editingTask, removeFile: false})}
                                            className="undo-remove-btn"
                                        >
                                            Deshacer
                                        </button>
                                    </div>
                                )}
                                {editingTask.newFile && (
                                    <div className="new-file-preview">
                                        <i className="fas fa-file"></i>
                                        <span>Nuevo archivo: {editingTask.newFile.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask({...editingTask, newFile: null})}
                                            className="remove-file-btn"
                                        >
                                            <i className="fas fa-times"></i>
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
                                    />
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTask(null);
                                }}
                                className="cancel-button"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className="save-button"
                                disabled={loading}
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
