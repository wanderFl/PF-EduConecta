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
                status: ATTENDANCE_STATUS.PRESENTE
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

        if (status === ATTENDANCE_STATUS.AUSENTE || status === ATTENDANCE_STATUS.JUSTIFICADO) {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case ATTENDANCE_STATUS.PRESENTE:
                return '#28a745';
            case ATTENDANCE_STATUS.AUSENTE:
                return '#dc3545';
            case ATTENDANCE_STATUS.TARDANZA:
                return '#ffc107';
            case ATTENDANCE_STATUS.JUSTIFICADO:
                return '#17a2b8';
            default:
                return '#6c757d';
        }
    };

    const getAttendanceStats = () => {
        const total = attendanceData.length;
        const presente = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.PRESENTE).length;
        const ausente = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.AUSENTE).length;
        const tardanza = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.TARDANZA).length;
        const justificado = attendanceData.filter(a => a.status === ATTENDANCE_STATUS.JUSTIFICADO).length;

        return { total, presente, ausente, tardanza, justificado };
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '1rem 2rem',
                marginBottom: '2rem',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#10b981',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginRight: '1rem'
                    }}>
                        ✅
                    </div>
                    <div>
                        <h1 style={{ margin: '0', color: '#333', fontSize: '1.8rem' }}>
                            Control de Asistencia - Inspector
                        </h1>
                        {selectedCourse && (
                            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                                {selectedCourse.nombre} - Paralelo {selectedCourse.paralelo}
                            </p>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleGoBack}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '2px solid #10b981',
                            borderRadius: '8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        ← Volver
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                marginBottom: '2rem',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{ marginTop: '0', color: '#333' }}>Seleccionar Curso y Paralelo</h3>
                <select
                    value={selectedCourse?.id_curso || ''}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'white'
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

            {error && (
                <div style={{
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: 'rgba(40, 167, 69, 0.1)',
                    border: '1px solid #28a745',
                    color: '#28a745',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    {success}
                </div>
            )}

            {selectedCourse && students.length > 0 && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    borderRadius: '15px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{ marginTop: '0', color: '#333' }}>Estadísticas del Día</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div style={{
                            background: '#28a745',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {stats.presente}
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>Presentes</div>
                        </div>
                        <div style={{
                            background: '#dc3545',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {stats.ausente}
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>Ausentes</div>
                        </div>
                        <div style={{
                            background: '#ffc107',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {stats.tardanza}
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>Tardanzas</div>
                        </div>
                        <div style={{
                            background: '#17a2b8',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {stats.justificado}
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>Justificados</div>
                        </div>
                        <div style={{
                            background: '#6c757d',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>Total</div>
                        </div>
                    </div>
                </div>
            )}

            {selectedCourse && students.length > 0 && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem',
                    borderRadius: '15px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ margin: '0', color: '#333' }}>
                            Lista de Estudiantes ({students.length})
                        </h3>
                        <button
                            onClick={saveAttendance}
                            disabled={saving}
                            style={{
                                background: saving ? '#6c757d' : '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {saving ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gap: '1rem'
                    }}>
                        {attendanceData.map((item) => (
                            <div
                                key={item.student.id}
                                style={{
                                    background: 'white',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                                        {item.student.nombre_completo}
                                    </h4>
                                    <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                        Cédula: {item.student.cedula || 'No disponible'}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
                                            <button
                                                key={key}
                                                onClick={() => handleStatusChange(item.student.id, value)}
                                                style={{
                                                    background: item.status === value ? getStatusColor(value) : 'white',
                                                    color: item.status === value ? 'white' : getStatusColor(value),
                                                    border: `2px solid ${getStatusColor(value)}`,
                                                    padding: '0.5rem 0.8rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {value}
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
                                                padding: '0.5rem',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '6px',
                                                fontSize: '0.9rem',
                                                resize: 'vertical'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && selectedCourse && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '2rem',
                    borderRadius: '15px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
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
                    <p>Cargando estudiantes...</p>
                </div>
            )}

            {!selectedCourse && !loading && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '3rem',
                    borderRadius: '15px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '4rem',
                        marginBottom: '1rem'
                    }}>
                        📚
                    </div>
                    <h3 style={{ color: '#333', marginBottom: '1rem' }}>
                        Selecciona un curso para comenzar
                    </h3>
                    <p style={{ color: '#666' }}>
                        Elige un curso y paralelo de la lista para ver los estudiantes y tomar asistencia
                    </p>
                </div>
            )}

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
