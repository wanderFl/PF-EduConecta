import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  studentsService, 
  attendanceService, 
  ATTENDANCE_STATUS, 
  type Student, 
  type AttendanceSubmission,
  type Course 
} from "../../services/students";

interface StudentAttendance {
  student: Student;
  status: string;
  justification?: string;
}

const AsistenciaInspector: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [showJustification, setShowJustification] = useState<{[key: number]: boolean}>({});

    const handleGoBack = () => {
        navigate('/inspector/dashboard');
    };

    const loadCourses = useCallback(async () => {
        try {
            setLoading(true);
            const coursesData = await studentsService.getAllCourses();
            setCourses(coursesData);
        } catch (err) {
            setError('Error al cargar los cursos');
            console.error('Error loading courses:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const handleCourseChange = (courseId: string) => {
        const course = courses.find(c => c.id_curso.toString() === courseId);
        if (course) {
            setSelectedCourse(course);
            loadStudents(course);
        } else {
            setSelectedCourse(null);
            setStudents([]);
            setAttendanceData([]);
        }
    };

    const loadStudents = async (course: Course) => {
        if (!course) return;
        
        setLoading(true);
        setError('');
        
        try {
            const studentsData = await studentsService.getStudentsByCourse(course.id_curso.toString());
            
            setStudents(studentsData);
            
            const initialAttendance = studentsData.map(student => ({
                student,
                status: ATTENDANCE_STATUS.PRESENT
            }));
            
            setAttendanceData(initialAttendance);
            
            await loadExistingAttendance(studentsData);
            
        } catch (error) {
            console.error('Error loading students:', error);
            setError('Error al cargar estudiantes. Verifica la conexión a la base de datos.');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingAttendance = async (studentsToCheck: Student[] = students) => {
        if (!studentsToCheck.length) return;

        try {
            const studentIds = studentsToCheck.map(s => s.id);
            const existingRecords = await attendanceService.getAttendanceByDate(selectedDate, studentIds);
            
            setAttendanceData(prev => prev.map(item => {
                const existingRecord = existingRecords.find(r => r.student_external_id === item.student.id);
                if (existingRecord) {
                    return {
                        ...item,
                        status: existingRecord.status,
                        justification: existingRecord.justification_file_reference || ''
                    };
                }
                return item;
            }));
        } catch (error) {
            console.error('Error loading existing attendance:', error);
        }
    };

    useEffect(() => {
        if (students.length > 0) {
            loadExistingAttendance();
        }
    }, [selectedDate, students.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStatusChange = (studentId: number, status: string) => {
        setAttendanceData(prev => prev.map(item => 
            item.student.id === studentId 
                ? { ...item, status }
                : item
        ));

        if (status === ATTENDANCE_STATUS.ABSENT_UNJUSTIFIED || 
            status === ATTENDANCE_STATUS.ABSENT_JUSTIFIED_PENDING || 
            status === ATTENDANCE_STATUS.ABSENT_JUSTIFIED_ACCEPTED) {
            setShowJustification(prev => ({ ...prev, [studentId]: true }));
        } else {
            setShowJustification(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleJustificationChange = (studentId: number, justification: string) => {
        setAttendanceData(prev => prev.map(item => 
            item.student.id === studentId 
                ? { ...item, justification }
                : item
        ));
    };

    const saveAttendance = async () => {
        if (!selectedCourse) {
            setError('Debe seleccionar un curso antes de guardar la asistencia');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const attendanceSubmissions: AttendanceSubmission[] = attendanceData.map(item => ({
                student_external_id: item.student.id,
                status: item.status,
                justification_file_reference: item.justification || undefined
            }));

            await attendanceService.saveBulkAttendance(selectedDate, attendanceSubmissions, selectedCourse.id_curso);
            setSuccess('Asistencia guardada exitosamente');
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving attendance:', error);
            setError('Error al guardar asistencia. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case ATTENDANCE_STATUS.PRESENT:
                return 'Presente';
            case ATTENDANCE_STATUS.ABSENT_UNJUSTIFIED:
                return 'Ausente';
            case ATTENDANCE_STATUS.ABSENT_JUSTIFIED_PENDING:
                return 'Justificación Pendiente';
            case ATTENDANCE_STATUS.ABSENT_JUSTIFIED_ACCEPTED:
                return 'Justificado';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case ATTENDANCE_STATUS.PRESENT:
                return '#28a745';
            case ATTENDANCE_STATUS.ABSENT_UNJUSTIFIED:
                return '#dc3545';
            case ATTENDANCE_STATUS.ABSENT_JUSTIFIED_PENDING:
                return '#ffc107';
            case ATTENDANCE_STATUS.ABSENT_JUSTIFIED_ACCEPTED:
                return '#17a2b8';
            default:
                return '#6c757d';
        }
    };

    const getAttendanceStats = () => {
        const total = attendanceData.length;
        const presente = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length;
        const ausenteInjustificado = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.ABSENT_UNJUSTIFIED).length;
        const ausentePendiente = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.ABSENT_JUSTIFIED_PENDING).length;
        const ausenteJustificado = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.ABSENT_JUSTIFIED_ACCEPTED).length;
        const ausente = ausenteInjustificado + ausentePendiente + ausenteJustificado;

        return { total, presente, ausente, ausenteInjustificado, ausentePendiente, ausenteJustificado };
    };

    const stats = getAttendanceStats();

    if (loading && courses.length === 0) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '2rem',
                    borderRadius: '15px',
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #10b981',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <p>Cargando cursos...</p>
                </div>
            </div>
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
                        ✅
                    </div>
                    <div>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#fff'
                        }}>
                            Control de Asistencia - Inspector
                        </div>
                        {selectedCourse && (
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#d7e3ff',
                                marginTop: '2px'
                            }}>
                                {selectedCourse.nombre} - Paralelo {selectedCourse.paralelo}
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                        ← Volver
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d7e3ff',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            background: '#fff',
                            color: '#111827'
                        }}
                    />
                </div>
            </div>

            {/* Contenedor principal */}
            <div style={{
                flex: 1,
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto',
                padding: '24px'
            }}>
                {/* Selector de curso */}
                <div style={{
                    background: '#fff',
                    padding: '20px',
                    marginBottom: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ marginTop: '0', color: '#111827', fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>
                        Seleccionar Curso y Paralelo
                    </h3>
                    <select
                        value={selectedCourse?.id_curso || ''}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d7e3ff',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            background: 'white',
                            color: '#111827'
                        }}
                    >
                        <option value="">Seleccione un curso...</option>
                        {courses.map(course => (
                            <option key={course.id_curso} value={course.id_curso}>
                                {course.nombre} - Paralelo {course.paralelo} ({course.nivel})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mensajes */}
                {error && (
                    <div style={{
                        background: '#fff',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.95rem'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: '#fff',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.95rem'
                    }}>
                        {success}
                    </div>
                )}

                {/* Estadísticas */}
                {selectedCourse && students.length > 0 && (
                    <div style={{
                        background: '#fff',
                        padding: '20px',
                        marginBottom: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h3 style={{ marginTop: '0', color: '#111827', fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                            Estadísticas del Día
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '12px'
                        }}>
                            <div style={{
                                background: '#10b981',
                                color: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {stats.presente}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Presentes</div>
                            </div>
                            <div style={{
                                background: '#ef4444',
                                color: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {stats.ausente}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Ausentes</div>
                            </div>
                            <div style={{
                                background: '#dc2626',
                                color: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {stats.ausenteInjustificado}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Injustificados</div>
                            </div>
                            <div style={{
                                background: '#f59e0b',
                                color: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {stats.ausentePendiente}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Pendientes</div>
                            </div>
                            <div style={{
                                background: '#0ea5e9',
                                color: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {stats.ausenteJustificado}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Justificados</div>
                            </div>
                            <div style={{
                                background: '#6b7280',
                                color: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {stats.total}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Total</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de estudiantes */}
                {selectedCourse && students.length > 0 && (
                    <div style={{
                        background: '#fff',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0', color: '#111827', fontSize: '1.1rem', fontWeight: '600' }}>
                                Lista de Estudiantes ({students.length})
                            </h3>
                            <button
                                onClick={saveAttendance}
                                disabled={saving}
                                style={{
                                    background: saving ? '#9ca3af' : '#1e4db7',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!saving) e.currentTarget.style.background = '#1a3d8f';
                                }}
                                onMouseLeave={(e) => {
                                    if (!saving) e.currentTarget.style.background = '#1e4db7';
                                }}
                            >
                                {saving ? 'Guardando...' : 'Guardar Asistencia'}
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gap: '12px'
                        }}>
                            {attendanceData.map((item) => (
                                <div
                                    key={item.student.id}
                                    style={{
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}
                                >
                                    <div>
                                        <h4 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '1rem', fontWeight: '600' }}>
                                            {item.student.nombre_completo}
                                        </h4>
                                        <p style={{ margin: '0', color: '#6b7280', fontSize: '0.85rem' }}>
                                            Cédula: {item.student.cedula || 'No disponible'}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleStatusChange(item.student.id, value)}
                                                    style={{
                                                        background: item.status === value ? getStatusColor(value) : 'white',
                                                        color: item.status === value ? 'white' : getStatusColor(value),
                                                        border: `1px solid ${getStatusColor(value)}`,
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {getStatusLabel(value)}
                                                </button>
                                            ))}
                                        </div>

                                        {showJustification[item.student.id] && (
                                            <textarea
                                                placeholder="Ingrese la justificación..."
                                                value={item.justification || ''}
                                                onChange={(e) => handleJustificationChange(item.student.id, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    minHeight: '60px',
                                                    padding: '8px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Estado de carga */}
                {loading && selectedCourse && (
                    <div style={{
                        background: '#fff',
                        padding: '40px',
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
                        <p style={{ color: '#6b7280', margin: 0 }}>Cargando estudiantes...</p>
                    </div>
                )}

                {/* Estado sin selección */}
                {!selectedCourse && !loading && (
                    <div style={{
                        background: '#fff',
                        padding: '60px 40px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '16px'
                        }}>
                            📚
                        </div>
                        <h3 style={{ color: '#111827', marginBottom: '12px', fontSize: '1.2rem', fontWeight: '600' }}>
                            Selecciona un curso para comenzar
                        </h3>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
                            Elige un curso y paralelo de la lista para ver los estudiantes y tomar asistencia
                        </p>
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default AsistenciaInspector;
