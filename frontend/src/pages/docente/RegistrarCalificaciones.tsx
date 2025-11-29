import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskService } from "../../services/tasks";
import type { Course, Task, Student } from "../../types";
import './RegistrarCalificaciones.css';

const RegistrarCalificaciones: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gradingStudent, setGradingStudent] = useState<number | null>(null);

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
            const response = await taskService.getTasksByCourse(courseId);
            if (response.success) {
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

    const handleGradeStudent = async (taskId: string, studentId: number, grade: number, comment?: string) => {
        if (grade < 0 || grade > 10) {
            setError('La calificación debe estar entre 0 y 10');
            return;
        }

        setGradingStudent(studentId);
        try {
            const response = await taskService.gradeTask(taskId, studentId, grade, comment);
            if (response.success) {
                // Actualizar la calificación en el estado local
                setTasks(prevTasks => 
                    prevTasks.map(task => 
                        task.id === taskId 
                            ? {
                                ...task,
                                students: task.students.map(student => 
                                    student.id === studentId 
                                        ? { 
                                            ...student, 
                                            grade: grade,
                                            comment_teacher: comment || null,
                                            graded_at: response.submission.graded_at
                                        }
                                        : student
                                )
                            }
                            : task
                    )
                );
                
                // Actualizar la tarea seleccionada si corresponde
                if (selectedTask && selectedTask.id === taskId) {
                    setSelectedTask(prev => prev ? {
                        ...prev,
                        students: prev.students.map(student => 
                            student.id === studentId 
                                ? { 
                                    ...student, 
                                    grade: grade,
                                    comment_teacher: comment || null,
                                    graded_at: response.submission.graded_at
                                }
                                : student
                        )
                    } : null);
                }

                // Actualizar estudiante seleccionado
                if (selectedStudent && selectedStudent.id === studentId) {
                    setSelectedStudent({
                        ...selectedStudent,
                        grade: grade,
                        comment_teacher: comment || null,
                        graded_at: response.submission.graded_at
                    });
                }
                
                setError(null);
            }
        } catch (err) {
            console.error('Error grading student:', err);
            setError(err instanceof Error ? err.message : 'Error registrando calificación');
        } finally {
            setGradingStudent(null);
        }
    };

    const handleDownloadTaskFile = async (filename: string) => {
        try {
            await taskService.downloadTaskFile(filename);
        } catch (err) {
            console.error('Error downloading task file:', err);
            setError(err instanceof Error ? err.message : 'Error descargando archivo de tarea');
        }
    };

    const handleDownloadSubmissionFile = async (filename: string) => {
        try {
            await taskService.downloadSubmissionFile(filename);
        } catch (err) {
            console.error('Error downloading submission file:', err);
            setError(err instanceof Error ? err.message : 'Error descargando archivo de entrega');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!selectedCourse) {
        return (
            <div className="calificaciones-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <div style={{ fontSize: '1.125rem', color: 'white' }}>Cargando...</div>
                </div>
            </div>
        );
    }

    // Vista de detalle del estudiante (similar a la imagen)
    if (selectedStudent && selectedTask) {
        return (
            <StudentDetailView
                student={selectedStudent}
                task={selectedTask}
                course={selectedCourse}
                onBack={() => setSelectedStudent(null)}
                onGrade={handleGradeStudent}
                onDownloadSubmission={handleDownloadSubmissionFile}
                onDownloadTask={handleDownloadTaskFile}
                isGrading={gradingStudent === selectedStudent.id}
                error={error}
                setError={setError}
            />
        );
    }

    return (
        <div className="calificaciones-container">
            <div className="calificaciones-content">
                <div className="calificaciones-card">
                    <div className="calificaciones-header">
                        <div className="calificaciones-header-content">
                            <div className="calificaciones-header-title">
                                <h1>Registrar Calificaciones</h1>
                                <p>Curso: {selectedCourse.name}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => navigate("/docente/tareas")}
                                    className="btn-calificaciones btn-primary"
                                    style={{
                                        backgroundColor: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    ✨ Crear Nueva Tarea
                                </button>
                                <button
                                    onClick={() => navigate("/docente/dashboard")}
                                    className="btn-calificaciones btn-secondary"
                                >
                                    ← Volver al Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert-calificaciones alert-error" style={{ margin: '1.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p style={{ fontSize: '1.125rem', color: '#667eea' }}>Cargando tareas...</p>
                        </div>
                    ) : (
                        <>
                            {!selectedTask ? (
                                <TaskListView
                                    tasks={tasks}
                                    onSelectTask={setSelectedTask}
                                    onDownloadTaskFile={handleDownloadTaskFile}
                                    formatDate={formatDate}
                                    navigate={navigate}
                                />
                            ) : (
                                <TaskStudentListView
                                    task={selectedTask}
                                    onBack={() => setSelectedTask(null)}
                                    onSelectStudent={setSelectedStudent}
                                    onGradeQuick={handleGradeStudent}
                                    formatDate={formatDate}
                                    isGrading={gradingStudent}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Vista de lista de tareas
interface TaskListViewProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
    onDownloadTaskFile: (filename: string) => void;
    formatDate: (date: string) => string;
    navigate: (path: string) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({
    tasks,
    onSelectTask,
    onDownloadTaskFile,
    formatDate,
    navigate
}) => (
    <div className="task-list-grid">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '1.5rem' }}>
            Seleccionar Tarea para Calificar
        </h2>
        {tasks.length === 0 ? (
            <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <h3 className="empty-state-title">No hay tareas creadas</h3>
                <p className="empty-state-description">
                    Comienza creando tu primera tarea para este curso
                </p>
                <button
                    onClick={() => navigate("/docente/crear-tarea")}
                    className="btn-calificaciones btn-primary"
                >
                    ➕ Crear Primera Tarea
                </button>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {tasks.map((task) => {
                    const totalStudents = task.students.length;
                    const submittedCount = task.students.filter(s => s.has_submission).length;
                    const gradedCount = task.students.filter(s => s.grade !== null && s.grade !== undefined).length;
                    const submissionPercentage = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
                    const gradedPercentage = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
                    
                    return (
                        <div key={task.id} className="task-card">
                            <div className="task-card-header">
                                <div style={{ flex: 1 }}>
                                    <h3 className="task-card-title">{task.title}</h3>
                                    {task.instructions && (
                                        <p className="task-card-description">{task.instructions}</p>
                                    )}
                                    <div className="task-card-meta">
                                        <div className="task-card-meta-item">
                                            <span>📅</span>
                                            <span><strong>Vence:</strong> {formatDate(task.due_date)}</span>
                                        </div>
                                        {task.max_points && (
                                            <div className="task-card-meta-item">
                                                <span>⭐</span>
                                                <span><strong>Puntos:</strong> {task.max_points}</span>
                                            </div>
                                        )}
                                        <div className="task-card-meta-item">
                                            <span>👥</span>
                                            <span><strong>Estudiantes:</strong> {totalStudents}</span>
                                        </div>
                                    </div>
                                    {task.file_reference && (
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onDownloadTaskFile(task.file_reference!);
                                            }}
                                            className="download-link"
                                        >
                                            📎 Descargar archivo adjunto
                                        </a>
                                    )}
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-label">
                                            <span><strong>Entregas:</strong> {submittedCount} de {totalStudents}</span>
                                            <span>{submissionPercentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-bar-fill" 
                                                style={{ width: `${submissionPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-label">
                                            <span><strong>Calificados:</strong> {gradedCount} de {totalStudents}</span>
                                            <span>{gradedPercentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-bar-fill" 
                                                style={{ width: `${gradedPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onSelectTask(task)}
                                    className="btn-calificaciones btn-primary"
                                >
                                    📝 Calificar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

// Vista de estudiantes de una tarea
interface TaskStudentListViewProps {
    task: Task;
    onBack: () => void;
    onSelectStudent: (student: Student) => void;
    onGradeQuick: (taskId: string, studentId: number, grade: number) => void;
    formatDate: (date: string) => string;
    isGrading: number | null;
}

const TaskStudentListView: React.FC<TaskStudentListViewProps> = ({
    task,
    onBack,
    onSelectStudent,
    formatDate,
    isGrading
}) => (
    <div className="students-table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '0.5rem' }}>
                    {task.title}
                </h2>
                <p style={{ color: '#718096', fontSize: '1rem' }}>
                    📅 Vence: {formatDate(task.due_date)}
                </p>
            </div>
            <button
                onClick={onBack}
                className="btn-calificaciones btn-secondary"
            >
                ← Volver a Tareas
            </button>
        </div>

        {task.students.length === 0 ? (
            <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3 className="empty-state-title">No hay estudiantes</h3>
                <p className="empty-state-description">
                    No hay estudiantes registrados en este curso
                </p>
            </div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>Estudiante</th>
                            <th>Estado de Entrega</th>
                            <th>Calificación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {task.students.map((student) => (
                            <tr key={student.id}>
                                <td>
                                    <div className="student-name">
                                        {student.nombre_completo}
                                    </div>
                                    <div className="student-id">
                                        ID: {student.id}
                                    </div>
                                </td>
                                <td>
                                    {student.has_submission ? (
                                        <div>
                                            <span className="status-badge status-submitted">
                                                ✓ Entregado
                                            </span>
                                            {student.submitted_at && (
                                                <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
                                                    {formatDate(student.submitted_at)}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="status-badge status-not-submitted">
                                            ✗ No entregado
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className="grade-display">
                                        {student.grade !== null && student.grade !== undefined ? (
                                            <>
                                                <span className={student.grade >= 7 ? 'grade-high' : 'grade-low'}>
                                                    {student.grade}/10
                                                </span>
                                                {student.grade >= 7 && <span className="status-badge status-graded">✓ Aprobado</span>}
                                            </>
                                        ) : (
                                            <span className="grade-pending">Sin calificar</span>
                                        )}
                                    </div>
                                    {student.graded_at && (
                                        <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
                                            {formatDate(student.graded_at)}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => onSelectStudent(student)}
                                            className="btn-action btn-action-primary"
                                            disabled={isGrading === student.id}
                                        >
                                            {isGrading === student.id ? '⏳ Procesando...' : '👁️ Ver Detalles'}
                                        </button>
                                        {student.file_reference && (
                                            <button
                                                onClick={() => onSelectStudent(student)}
                                                className="btn-action btn-action-success"
                                            >
                                                📎 Entrega
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

// Vista de detalle del estudiante (similar a la imagen adjunta)
interface StudentDetailViewProps {
    student: Student;
    task: Task;
    course: Course;
    onBack: () => void;
    onGrade: (taskId: string, studentId: number, grade: number, comment?: string) => void;
    onDownloadSubmission: (filename: string) => void;
    onDownloadTask: (filename: string) => void;
    isGrading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({
    student,
    task,
    course,
    onBack,
    onGrade,
    onDownloadSubmission,
    onDownloadTask,
    isGrading,
    error,
    setError
}) => {
    const [grade, setGrade] = useState(student.grade?.toString() || '');
    const [comment, setComment] = useState(student.comment_teacher || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const gradeNum = parseFloat(grade);
        
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
            setError('La calificación debe ser un número entre 0 y 10');
            return;
        }
        
        onGrade(task.id, student.id, gradeNum, comment.trim() || undefined);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="detail-view-container">
            <div className="detail-view-content">
                <div className="detail-view-card">
                    {/* Header */}
                    <div className="detail-view-header">
                        <div className="detail-view-header-content">
                            <div className="detail-view-info">
                                <h1>📝 Detalles de la Tarea</h1>
                                <div className="detail-info-grid">
                                    <div className="detail-info-item"><strong>Tarea:</strong> {task.title}</div>
                                    <div className="detail-info-item"><strong>Estudiante:</strong> {student.nombre_completo}</div>
                                    <div className="detail-info-item"><strong>Curso:</strong> {course.name}</div>
                                    <div className="detail-info-item"><strong>ID Estudiante:</strong> {student.id}</div>
                                </div>
                            </div>
                            <div className="detail-view-actions">
                                <button
                                    onClick={onBack}
                                    className="btn-calificaciones btn-warning"
                                >
                                    💾 Guardar y Cerrar
                                </button>
                                <button
                                    onClick={onBack}
                                    className="btn-calificaciones btn-danger"
                                >
                                    ✗ Cancelar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="detail-view-body">
                        {error && (
                            <div className="alert-calificaciones alert-error">
                                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Información de la tarea */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">📋 Información de la Tarea</h3>
                            <div className="detail-section-content">
                                <p><strong>Instrucciones:</strong> {task.instructions || 'No hay instrucciones'}</p>
                                <p><strong>📅 Fecha de Entrega:</strong> {formatDate(task.due_date)}</p>
                                <p><strong>📤 Fecha de Envío:</strong> {student.submitted_at ? formatDate(student.submitted_at) : 'No enviado'}</p>
                                {task.max_points && (
                                    <p><strong>⭐ Puntuación Máxima:</strong> {task.max_points} puntos</p>
                                )}
                            </div>
                            
                            {task.file_reference && (
                                <div style={{ marginTop: '1rem' }}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onDownloadTask(task.file_reference!);
                                        }}
                                        className="download-link"
                                    >
                                        📎 Descargar archivo de la tarea
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Comentario del estudiante */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">💬 Comentario del Estudiante</h3>
                            <p className="detail-section-content">
                                {student.comment_student || 'El estudiante no dejó comentarios'}
                            </p>
                        </div>

                        {/* Archivo de entrega */}
                        {student.file_reference && (
                            <div className="detail-section">
                                <h3 className="detail-section-title">📂 Archivo de Entrega</h3>
                                <button
                                    onClick={() => onDownloadSubmission(student.file_reference!)}
                                    className="btn-calificaciones btn-success"
                                >
                                    📥 Descargar Entrega del Estudiante
                                </button>
                            </div>
                        )}

                        {/* Calificación */}
                        <form onSubmit={handleSubmit} className="detail-section">
                            <h3 className="detail-section-title">✍️ Calificación</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">
                                        Calificación (0-10)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="form-input"
                                        placeholder="Ingrese la calificación"
                                        disabled={isGrading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    💭 Retroalimentación
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="form-textarea"
                                    rows={4}
                                    placeholder="Escriba sus comentarios sobre la entrega del estudiante..."
                                    disabled={isGrading}
                                />
                            </div>

                            {student.grade !== null && student.grade !== undefined && (
                                <div className="current-grade-info">
                                    <span>Calificación actual:</span>
                                    <strong className={student.grade >= 7 ? 'grade-high' : 'grade-low'}>
                                        {student.grade}/10
                                    </strong>
                                    {student.graded_at && (
                                        <span style={{ marginLeft: 'auto' }}>
                                            📅 Calificado el: {formatDate(student.graded_at)}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    disabled={isGrading}
                                    className="btn-calificaciones btn-success"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {isGrading ? '⏳ Guardando...' : '💾 Guardar Calificación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrarCalificaciones;