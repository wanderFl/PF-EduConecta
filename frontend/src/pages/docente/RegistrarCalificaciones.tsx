import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskService } from "../../services/tasks";
import type { Course, Task, Student } from "../../types";

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
            <div style={{ 
                minHeight: '100vh', 
                background: '#f7f8fb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        border: '3px solid #e5e7eb',
                        borderTop: '3px solid #1e4db7',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Cargando...</div>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
                        fontSize: '1.2rem'
                    }}>
                        📝
                    </div>
                    <div>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#fff'
                        }}>
                            Registrar Calificaciones
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#d7e3ff',
                            marginTop: '2px'
                        }}>
                            Curso: {selectedCourse.name}
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate("/docente/tareas")}
                        style={{
                            background: '#fff',
                            color: '#1e4db7',
                            border: '1px solid #d7e3ff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
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
                        ✨ Crear Nueva Tarea
                    </button>
                    <button
                        onClick={() => navigate("/docente/dashboard")}
                        style={{
                            background: '#fff',
                            color: '#1e4db7',
                            border: '1px solid #d7e3ff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
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
                        ← Volver al Dashboard
                    </button>
                </div>
            </div>

            {/* Contenedor principal */}
            <div style={{
                flex: 1,
                maxWidth: '1400px',
                width: '100%',
                margin: '0 auto',
                padding: '24px'
            }}>
                {error && (
                    <div style={{
                        background: '#fff',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div style={{
                        background: '#fff',
                        padding: '60px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            border: '3px solid #e5e7eb',
                            borderTop: '3px solid #1e4db7',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Cargando tareas...</p>
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
    <div>
        <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '20px' 
        }}>
            Seleccionar Tarea para Calificar
        </h2>
        {tasks.length === 0 ? (
            <div style={{
                background: '#fff',
                padding: '60px 24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📚</div>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                }}>
                    No hay tareas creadas
                </h3>
                <p style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    marginBottom: '24px'
                }}>
                    Comienza creando tu primera tarea para este curso
                </p>
                <button
                    onClick={() => navigate("/docente/crear-tarea")}
                    style={{
                        background: '#1e4db7',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a3a8f'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#1e4db7'}
                >
                    ➕ Crear Primera Tarea
                </button>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
                {tasks.map((task) => {
                    const totalStudents = task.students.length;
                    const submittedCount = task.students.filter(s => s.has_submission).length;
                    const gradedCount = task.students.filter(s => s.grade !== null && s.grade !== undefined).length;
                    const submissionPercentage = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
                    const gradedPercentage = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
                    
                    return (
                        <div key={task.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '20px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    marginBottom: '8px'
                                }}>
                                    {task.title}
                                </h3>
                                {task.instructions && (
                                    <p style={{
                                        fontSize: '0.95rem',
                                        color: '#6b7280',
                                        marginBottom: '16px',
                                        lineHeight: '1.5'
                                    }}>
                                        {task.instructions}
                                    </p>
                                )}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '16px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.9rem',
                                        color: '#4b5563'
                                    }}>
                                        <span>📅</span>
                                        <span><strong>Vence:</strong> {formatDate(task.due_date)}</span>
                                    </div>
                                    {task.max_points && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.9rem',
                                            color: '#4b5563'
                                        }}>
                                            <span>⭐</span>
                                            <span><strong>Puntos:</strong> {task.max_points}</span>
                                        </div>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.9rem',
                                        color: '#4b5563'
                                    }}>
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
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#1e4db7',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            marginBottom: '16px'
                                        }}
                                    >
                                        📎 Descargar archivo adjunto
                                    </a>
                                )}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '6px',
                                        fontSize: '0.875rem',
                                        color: '#4b5563'
                                    }}>
                                        <span><strong>Entregas:</strong> {submittedCount} de {totalStudents}</span>
                                        <span>{submissionPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e5e7eb',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${submissionPercentage}%`,
                                            height: '100%',
                                            background: '#1e4db7',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '6px',
                                        fontSize: '0.875rem',
                                        color: '#4b5563'
                                    }}>
                                        <span><strong>Calificados:</strong> {gradedCount} de {totalStudents}</span>
                                        <span>{gradedPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e5e7eb',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${gradedPercentage}%`,
                                            height: '100%',
                                            background: '#10b981',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onSelectTask(task)}
                                style={{
                                    background: '#1e4db7',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#1a3a8f'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#1e4db7'}
                            >
                                📝 Calificar
                            </button>
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
    <div>
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px', 
            flexWrap: 'wrap', 
            gap: '16px' 
        }}>
            <div>
                <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: '#1f2937', 
                    marginBottom: '4px' 
                }}>
                    {task.title}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                    📅 Vence: {formatDate(task.due_date)}
                </p>
            </div>
            <button
                onClick={onBack}
                style={{
                    background: '#fff',
                    color: '#1e4db7',
                    border: '1px solid #e5e7eb',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f7ff';
                    e.currentTarget.style.borderColor = '#1e4db7';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                }}
            >
                ← Volver a Tareas
            </button>
        </div>

        {task.students.length === 0 ? (
            <div style={{
                background: '#fff',
                padding: '60px 24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>👥</div>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                }}>
                    No hay estudiantes
                </h3>
                <p style={{
                    fontSize: '1rem',
                    color: '#6b7280'
                }}>
                    No hay estudiantes registrados en este curso
                </p>
            </div>
        ) : (
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.95rem'
                    }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Estudiante
                                </th>
                                <th style={{
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Estado de Entrega
                                </th>
                                <th style={{
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Calificación
                                </th>
                                <th style={{
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {task.students.map((student) => (
                                <tr key={student.id} style={{
                                    borderBottom: '1px solid #f3f4f6',
                                    transition: 'background 0.2s ease'
                                }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{
                                            fontWeight: '500',
                                            color: '#1f2937',
                                            marginBottom: '4px'
                                        }}>
                                            {student.nombre_completo}
                                        </div>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#6b7280'
                                        }}>
                                            ID: {student.id}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {student.has_submission ? (
                                            <div>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    background: '#d1fae5',
                                                    color: '#065f46',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500'
                                                }}>
                                                    ✓ Entregado
                                                </span>
                                                {student.submitted_at && (
                                                    <div style={{ 
                                                        fontSize: '0.8rem', 
                                                        color: '#6b7280', 
                                                        marginTop: '6px' 
                                                    }}>
                                                        {formatDate(student.submitted_at)}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 12px',
                                                borderRadius: '6px',
                                                background: '#fee2e2',
                                                color: '#991b1b',
                                                fontSize: '0.875rem',
                                                fontWeight: '500'
                                            }}>
                                                ✗ No entregado
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div>
                                            {student.grade !== null && student.grade !== undefined ? (
                                                <>
                                                    <span style={{
                                                        fontSize: '1.125rem',
                                                        fontWeight: '700',
                                                        color: student.grade >= 7 ? '#10b981' : '#ef4444'
                                                    }}>
                                                        {student.grade}/10
                                                    </span>
                                                    {student.grade >= 7 && (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            marginLeft: '8px',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            background: '#d1fae5',
                                                            color: '#065f46',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            ✓ Aprobado
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span style={{
                                                    color: '#9ca3af',
                                                    fontSize: '0.9rem',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Sin calificar
                                                </span>
                                            )}
                                        </div>
                                        {student.graded_at && (
                                            <div style={{ 
                                                fontSize: '0.8rem', 
                                                color: '#6b7280', 
                                                marginTop: '6px' 
                                            }}>
                                                {formatDate(student.graded_at)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => onSelectStudent(student)}
                                                disabled={isGrading === student.id}
                                                style={{
                                                    background: isGrading === student.id ? '#e5e7eb' : '#1e4db7',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '8px 14px',
                                                    borderRadius: '6px',
                                                    fontWeight: '500',
                                                    cursor: isGrading === student.id ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s ease',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (isGrading !== student.id) {
                                                        e.currentTarget.style.background = '#1a3a8f';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (isGrading !== student.id) {
                                                        e.currentTarget.style.background = '#1e4db7';
                                                    }
                                                }}
                                            >
                                                {isGrading === student.id ? '⏳ Procesando...' : '👁️ Ver Detalles'}
                                            </button>
                                            {student.file_reference && (
                                                <button
                                                    onClick={() => onSelectStudent(student)}
                                                    style={{
                                                        background: '#10b981',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 14px',
                                                        borderRadius: '6px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        transition: 'all 0.2s ease',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
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
        <div style={{
            minHeight: '100vh',
            background: '#f7f8fb'
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
                        fontSize: '1.2rem'
                    }}>
                        📝
                    </div>
                    <div>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#fff'
                        }}>
                            Detalles de la Tarea
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#d7e3ff',
                            marginTop: '2px'
                        }}>
                            {student.nombre_completo}
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: '#fff',
                            color: '#1e4db7',
                            border: '1px solid #d7e3ff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
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
                        ← Volver
                    </button>
                </div>
            </div>

            {/* Contenido */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '24px'
            }}>
                {error && (
                    <div style={{
                        background: '#fff',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Información general */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '16px'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
                                Tarea
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                                {task.title}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
                                Estudiante
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                                {student.nombre_completo}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
                                Curso
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                                {course.name}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
                                ID Estudiante
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                                {student.id}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información de la tarea */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px',
                    marginBottom: '16px'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📋 Información de la Tarea
                    </h3>
                    <div style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>Instrucciones:</strong> {task.instructions || 'No hay instrucciones'}
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>📅 Fecha de Entrega:</strong> {formatDate(task.due_date)}
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>📤 Fecha de Envío:</strong> {student.submitted_at ? formatDate(student.submitted_at) : 'No enviado'}
                        </p>
                        {task.max_points && (
                            <p style={{ marginBottom: '8px' }}>
                                <strong>⭐ Puntuación Máxima:</strong> {task.max_points} puntos
                            </p>
                        )}
                    </div>
                    
                    {task.file_reference && (
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onDownloadTask(task.file_reference!);
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#1e4db7',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                marginTop: '12px'
                            }}
                        >
                            📎 Descargar archivo de la tarea
                        </a>
                    )}
                </div>

                {/* Comentario del estudiante */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px',
                    marginBottom: '16px'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        💬 Comentario del Estudiante
                    </h3>
                    <p style={{
                        fontSize: '0.95rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        fontStyle: student.comment_student ? 'normal' : 'italic'
                    }}>
                        {student.comment_student || 'El estudiante no dejó comentarios'}
                    </p>
                </div>

                {/* Archivo de entrega */}
                {student.file_reference && (
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        padding: '20px',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            📂 Archivo de Entrega
                        </h3>
                        <button
                            onClick={() => onDownloadSubmission(student.file_reference!)}
                            style={{
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                        >
                            📥 Descargar Entrega del Estudiante
                        </button>
                    </div>
                )}

                {/* Formulario de Calificación */}
                <form onSubmit={handleSubmit} style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        ✍️ Calificación
                    </h3>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Calificación (0-10)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="Ingrese la calificación"
                            disabled={isGrading}
                            required
                            style={{
                                width: '100%',
                                maxWidth: '300px',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            💭 Retroalimentación
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="Escriba sus comentarios sobre la entrega del estudiante..."
                            disabled={isGrading}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </div>

                    {student.grade !== null && student.grade !== undefined && (
                        <div style={{
                            background: '#f9fafb',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '20px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <span style={{ fontSize: '0.95rem', color: '#6b7280' }}>
                                Calificación actual:
                            </span>
                            <strong style={{
                                fontSize: '1.125rem',
                                fontWeight: '700',
                                color: student.grade >= 7 ? '#10b981' : '#ef4444'
                            }}>
                                {student.grade}/10
                            </strong>
                            {student.graded_at && (
                                <span style={{ 
                                    marginLeft: 'auto',
                                    fontSize: '0.875rem',
                                    color: '#6b7280'
                                }}>
                                    📅 Calificado el: {formatDate(student.graded_at)}
                                </span>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isGrading}
                        style={{
                            width: '100%',
                            background: isGrading ? '#9ca3af' : '#1e4db7',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: isGrading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!isGrading) e.currentTarget.style.background = '#1a3a8f';
                        }}
                        onMouseLeave={(e) => {
                            if (!isGrading) e.currentTarget.style.background = '#1e4db7';
                        }}
                    >
                        {isGrading ? '⏳ Guardando...' : '💾 Guardar Calificación'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegistrarCalificaciones;