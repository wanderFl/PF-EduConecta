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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Cargando...</div>
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Registrar Calificaciones
                            </h1>
                            <p className="text-gray-600">
                                Curso: {selectedCourse.name}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/docente/dashboard")}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            Volver al Dashboard
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Cargando tareas...</p>
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
    <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Seleccionar Tarea para Calificar
        </h2>
        {tasks.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                    No hay tareas creadas para este curso
                </p>
                <button
                    onClick={() => navigate("/docente/crear-tarea")}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    Crear Primera Tarea
                </button>
            </div>
        ) : (
            <div className="grid gap-4">
                {tasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {task.title}
                                </h3>
                                {task.instructions && (
                                    <p className="text-gray-600 mb-2 line-clamp-2">
                                        {task.instructions}
                                    </p>
                                )}
                                <div className="text-sm text-gray-500 space-x-4">
                                    <span>Vence: {formatDate(task.due_date)}</span>
                                    {task.max_points && (
                                        <span>Puntos máximos: {task.max_points}</span>
                                    )}
                                    <span>Estudiantes: {task.students.length}</span>
                                    <span>
                                        Entregas: {task.students.filter(s => s.has_submission).length}
                                    </span>
                                    <span>
                                        Calificados: {task.students.filter(s => s.grade !== null && s.grade !== undefined).length}
                                    </span>
                                </div>
                                {task.file_reference && (
                                    <button
                                        onClick={() => onDownloadTaskFile(task.file_reference!.split('/').pop()!)}
                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                    >
                                        📎 Descargar archivo adjunto
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => onSelectTask(task)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                                Calificar
                            </button>
                        </div>
                    </div>
                ))}
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
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">
                    {task.title}
                </h2>
                <p className="text-gray-600">
                    Vence: {formatDate(task.due_date)}
                </p>
            </div>
            <button
                onClick={onBack}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
                Volver a Tareas
            </button>
        </div>

        {task.students.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                    No hay estudiantes registrados en este curso
                </p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Estudiante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Estado de Entrega
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Calificación
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {task.students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap border-b">
                                    <div className="text-sm font-medium text-gray-900">
                                        {student.nombre_completo}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        ID: {student.id}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap border-b">
                                    <div className="flex items-center">
                                        {student.has_submission ? (
                                            <div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Entregado
                                                </span>
                                                {student.submitted_at && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatDate(student.submitted_at)}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                No entregado
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap border-b">
                                    <div className="flex items-center">
                                        <span className={`text-sm font-medium ${
                                            student.grade !== null && student.grade !== undefined 
                                                ? student.grade >= 7 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                                : 'text-gray-400'
                                        }`}>
                                            {student.grade !== null && student.grade !== undefined 
                                                ? `${student.grade}/10`
                                                : 'Sin calificar'
                                            }
                                        </span>
                                        {student.graded_at && (
                                            <div className="text-xs text-gray-500 ml-2">
                                                {formatDate(student.graded_at)}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-b">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onSelectStudent(student)}
                                            className="text-blue-600 hover:text-blue-900 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                                            disabled={isGrading === student.id}
                                        >
                                            {isGrading === student.id ? 'Procesando...' : 'Ver Detalles'}
                                        </button>
                                        {student.file_reference && (
                                            <button
                                                onClick={() => onSelectStudent(student)}
                                                className="text-green-600 hover:text-green-900 px-3 py-1 border border-green-600 rounded hover:bg-green-50"
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md">
                    {/* Header similar a la imagen */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-800">
                                    Detalles de la Tarea
                                </h1>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm"><strong>Nombre:</strong> {task.title}</p>
                                    <p className="text-sm"><strong>Estudiante:</strong> {student.nombre_completo}</p>
                                    <p className="text-sm"><strong>Curso:</strong> {course.name}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onBack}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                                >
                                    Guardar y Cerrar
                                </button>
                                <button
                                    onClick={onBack}
                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        {/* Información de la tarea */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-2">Información de la Tarea</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Instrucciones:</strong> {task.instructions || 'No hay instrucciones'}</p>
                                <p><strong>Fecha de Entrega:</strong> {formatDate(task.due_date)}</p>
                                <p><strong>Fecha de Envío:</strong> {student.submitted_at ? formatDate(student.submitted_at) : 'No enviado'}</p>
                                {task.max_points && (
                                    <p><strong>Puntuación Máxima:</strong> {task.max_points} puntos</p>
                                )}
                            </div>
                            
                            {task.file_reference && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => onDownloadTask(task.file_reference!.split('/').pop()!)}
                                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                                    >
                                        📎 Descargar archivo de la tarea
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Comentario del estudiante */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-2">Comentario del Estudiante</h3>
                            <p className="text-sm text-gray-600">
                                {student.comment_student || 'El estudiante no dejó comentarios'}
                            </p>
                        </div>

                        {/* Archivo de entrega */}
                        {student.file_reference && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium text-gray-800 mb-2">Archivo de Entrega</h3>
                                <button
                                    onClick={() => onDownloadSubmission(student.file_reference!.split('/').pop()!)}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    📎 Descargar Entrega del Estudiante
                                </button>
                            </div>
                        )}

                        {/* Calificación */}
                        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-4">Calificación</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Calificación (0-10)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ingrese la calificación"
                                        disabled={isGrading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Retroalimentación
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                    placeholder="Escriba sus comentarios sobre la entrega del estudiante..."
                                    disabled={isGrading}
                                />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isGrading}
                                    className={`px-6 py-2 rounded transition-colors ${
                                        isGrading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                                >
                                    {isGrading ? 'Guardando...' : 'Guardar Calificación'}
                                </button>
                                
                                {student.grade !== null && student.grade !== undefined && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span>Calificación actual: <strong>{student.grade}/10</strong></span>
                                        {student.graded_at && (
                                            <span className="ml-3">Fecha: {formatDate(student.graded_at)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrarCalificaciones;