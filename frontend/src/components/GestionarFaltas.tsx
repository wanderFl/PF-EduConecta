import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/attendance';
import type { AttendanceRecord, Student, AttendanceStats, AttendanceStatus } from '../services/attendance';
import './GestionarFaltas.css';

interface GestionarFaltasProps {
  className?: string;
}

const GestionarFaltas: React.FC<GestionarFaltasProps> = ({ className = '' }) => {
  // Estados principales
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados de filtros y selección
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedParallel, setSelectedParallel] = useState<string>('');
  const [availableParallels, setAvailableParallels] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Estados para el historial
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    start_date: '',
    end_date: '',
    student_id: undefined as number | undefined
  });

  // Estado para la gestión de asistencia del día
  const [dailyAttendance, setDailyAttendance] = useState<{
    [studentId: number]: {
      status: AttendanceStatus;
      justification?: string;
      justification_file?: File;
    }
  }>({});

  // Estado para justificaciones
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [justificationFile, setJustificationFile] = useState<File | null>(null);

  // Estado para edición de registros existentes
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Cargar estudiantes cuando se selecciona curso y paralelo
  const loadStudents = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      setLoading(true);
      let studentsData: Student[];
      
      if (selectedParallel) {
        studentsData = await attendanceService.getStudentsByCourseAndParallel(
          parseInt(selectedCourse), 
          selectedParallel
        );
      } else {
        studentsData = await attendanceService.getStudentsByCourse(parseInt(selectedCourse));
      }
      
      setStudents(studentsData);
      
      // Inicializar el estado de asistencia diaria
      const initialAttendance: typeof dailyAttendance = {};
      studentsData.forEach(student => {
        initialAttendance[student.id] = { status: 'PRESENT' };
      });
      setDailyAttendance(initialAttendance);
      
    } catch (err) {
      setError('Error al cargar los estudiantes');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedParallel]);

  // Cargar paralelos cuando se selecciona un curso
  const loadParallels = useCallback(async (courseId: number) => {
    try {
      const parallels = await attendanceService.getParallelsByCourse(courseId);
      setAvailableParallels(parallels);
    } catch (err) {
      console.error('Error loading parallels:', err);
      setAvailableParallels([]);
    }
  }, []);

  // Cargar registros de asistencia existentes para la fecha seleccionada
  const loadExistingAttendance = useCallback(async () => {
    if (!selectedCourse || !selectedDate) return;

    try {
      let records: AttendanceRecord[];
      
      if (selectedParallel) {
        records = await attendanceService.getAttendanceByCourseAndParallel(
          parseInt(selectedCourse), 
          selectedParallel, 
          selectedDate
        );
      } else {
        records = await attendanceService.getAttendanceByCourse(
          parseInt(selectedCourse), 
          selectedDate
        );
      }
      
      // Actualizar el estado de asistencia diaria con los registros existentes
      const updatedAttendance = { ...dailyAttendance };
      records.forEach(record => {
        if (updatedAttendance[record.student_external_id]) {
          updatedAttendance[record.student_external_id] = {
            status: record.status,
            justification: record.justification_file_reference || ''
          };
        }
      });
      setDailyAttendance(updatedAttendance);
      
    } catch (err) {
      console.error('Error loading existing attendance:', err);
    }
  }, [selectedCourse, selectedParallel, selectedDate, dailyAttendance]);

  // Cargar historial de asistencias
  const loadAttendanceHistory = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      const filters = {
        course_id: parseInt(selectedCourse),
        parallel: selectedParallel || undefined,
        start_date: historyFilters.start_date || undefined,
        end_date: historyFilters.end_date || undefined,
        student_id: historyFilters.student_id
      };

      const records = await attendanceService.getAllAttendance(filters);
      setAttendanceRecords(records);
    } catch (err) {
      console.error('Error loading attendance history:', err);
      setError('Error al cargar el historial de asistencias');
    }
  }, [selectedCourse, selectedParallel, historyFilters]);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      const filters = {
        course_id: parseInt(selectedCourse),
        parallel: selectedParallel || undefined,
        start_date: historyFilters.start_date || undefined,
        end_date: historyFilters.end_date || undefined
      };

      const statsData = await attendanceService.getAttendanceStats(filters);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [selectedCourse, selectedParallel, historyFilters]);

  // Efectos
  useEffect(() => {
    if (selectedCourse) {
      const courseId = parseInt(selectedCourse);
      if (!isNaN(courseId)) {
        loadParallels(courseId);
      }
    } else {
      setAvailableParallels([]);
      setSelectedParallel('');
    }
  }, [selectedCourse, loadParallels]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      loadExistingAttendance();
    }
  }, [selectedCourse, selectedParallel, selectedDate, loadExistingAttendance]);

  useEffect(() => {
    if (showHistory) {
      loadAttendanceHistory();
      loadStats();
    }
  }, [showHistory, loadAttendanceHistory, loadStats]);

  // Manejar cambio de estado de asistencia
  const handleAttendanceChange = (studentId: number, status: AttendanceStatus) => {
    setDailyAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Guardar registros de asistencia
  const saveAttendanceRecords = async () => {
    if (!selectedCourse || !selectedDate) {
      setError('Selecciona un curso y una fecha');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const records = Object.entries(dailyAttendance).map(([studentId, attendance]) => ({
        student_external_id: parseInt(studentId),
        status: attendance.status,
        justification_file_reference: attendance.justification
      }));

      await attendanceService.createBulkAttendance({
        course_external_id: parseInt(selectedCourse),
        date: selectedDate,
        records
      });

      setSuccessMessage('Registros de asistencia guardados exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      setError('Error al guardar los registros de asistencia');
      console.error('Error saving attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de justificación
  const openJustificationModal = (student: Student) => {
    setSelectedStudent(student);
    setJustificationText('');
    setJustificationFile(null);
    setShowJustificationModal(true);
  };

  // Guardar justificación
  const saveJustification = async () => {
    if (!selectedStudent) return;

    try {
      let fileReference = '';
      
      if (justificationFile) {
        fileReference = await attendanceService.uploadJustificationFile(justificationFile);
      }

      setDailyAttendance(prev => ({
        ...prev,
        [selectedStudent.id]: {
          ...prev[selectedStudent.id],
          justification: fileReference || justificationText
        }
      }));

      setShowJustificationModal(false);
      setSuccessMessage('Justificación agregada');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      setError('Error al guardar la justificación');
      console.error('Error saving justification:', err);
    }
  };

  // Exportar reporte
  const exportReport = async () => {
    try {
      const filters = {
        course_id: parseInt(selectedCourse),
        parallel: selectedParallel || undefined,
        start_date: historyFilters.start_date || undefined,
        end_date: historyFilters.end_date || undefined
      };

      const blob = await attendanceService.exportAttendanceReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `reporte-asistencia-${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Error al exportar el reporte');
      console.error('Error exporting report:', err);
    }
  };

  // Abrir modal de edición de registro
  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  // Actualizar registro existente
  const updateAttendanceRecord = async (newStatus: AttendanceStatus) => {
    if (!editingRecord) return;

    try {
      await attendanceService.updateAttendanceRecord(editingRecord.id, {
        status: newStatus
      });

      // Recargar historial para mostrar cambios
      loadAttendanceHistory();
      setShowEditModal(false);
      setEditingRecord(null);
      setSuccessMessage('Estado de asistencia actualizado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      setError('Error al actualizar el estado de asistencia');
      console.error('Error updating attendance:', err);
    }
  };

  // Obtener nombre del curso
  const getCourseName = (courseId: number): string => {
    const courseNames: { [key: number]: string } = {
      8: '8vo',
      9: '9no', 
      10: '10mo',
      11: '1ro BGU',
      12: '2do BGU',
      13: '3ro BGU'
    };
    return courseNames[courseId] || `Curso ${courseId}`;
  };

  // Obtener cursos disponibles (simulado, en una implementación real vendría del backend)
  const getAvailableCourses = () => {
    return [
      { id: 8, name: '8vo' },
      { id: 9, name: '9no' },
      { id: 10, name: '10mo' },
      { id: 11, name: '1ro BGU' },
      { id: 12, name: '2do BGU' },
      { id: 13, name: '3ro BGU' }
    ];
  };

  return (
    <div className={`gestionar-faltas ${className}`}>
      <div className="faltas-header">
        <h2>
          <i className="fas fa-user-check"></i>
          Gestionar Faltas y Asistencias
        </h2>

        {/* Mensajes */}
        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}

        {/* Filtros principales */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedParallel('');
              }}
            >
              <option value="">Seleccionar curso</option>
              {getAvailableCourses().map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && availableParallels.length > 0 && (
            <div className="filter-group">
              <label>Paralelo:</label>
              <select
                value={selectedParallel}
                onChange={(e) => setSelectedParallel(e.target.value)}
              >
                <option value="">Todos los paralelos</option>
                {availableParallels.map(parallel => (
                  <option key={parallel} value={parallel}>
                    {parallel}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>Fecha:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="actions-group">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary"
            >
              <i className={`fas ${showHistory ? 'fa-calendar-plus' : 'fa-history'}`}></i>
              {showHistory ? 'Registrar Asistencia' : 'Ver Historial'}
            </button>

            {selectedCourse && (
              <button 
                onClick={exportReport}
                className="btn-info"
              >
                <i className="fas fa-download"></i>
                Exportar Reporte
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      )}

      {/* Vista de registro de asistencia */}
      {!showHistory && selectedCourse && !loading && (
        <div className="attendance-registration">
          <div className="registration-header">
            <h3>
              Registro de Asistencia - {getCourseName(parseInt(selectedCourse))}
              {selectedParallel && ` - Paralelo ${selectedParallel}`}
            </h3>
            <p>Fecha: {attendanceService.formatDate(selectedDate)}</p>
          </div>

          {students.length === 0 ? (
            <div className="no-students">
              <i className="fas fa-users"></i>
              <p>No hay estudiantes registrados para este curso</p>
            </div>
          ) : (
            <>
              <div className="students-attendance-list">
                {students.map(student => (
                  <div key={student.id} className="student-attendance-card">
                    <div className="student-info">
                      <h4>{student.name}</h4>
                      <span className="student-id">ID: {student.id}</span>
                    </div>

                    <div className="attendance-options">
                      <label className="attendance-option presente">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value="PRESENT"
                          checked={dailyAttendance[student.id]?.status === 'PRESENT'}
                          onChange={() => handleAttendanceChange(student.id, 'PRESENT')}
                        />
                        <span className="option-icon">
                          <i className="fas fa-check-circle"></i>
                        </span>
                        <span>Presente</span>
                      </label>

                      <label className="attendance-option ausente">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value="ABSENT_UNJUSTIFIED"
                          checked={dailyAttendance[student.id]?.status === 'ABSENT_UNJUSTIFIED'}
                          onChange={() => handleAttendanceChange(student.id, 'ABSENT_UNJUSTIFIED')}
                        />
                        <span className="option-icon">
                          <i className="fas fa-times-circle"></i>
                        </span>
                        <span>Ausente</span>
                      </label>

                      <label className="attendance-option atraso">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value="ABSENT_JUSTIFIED_PENDING"
                          checked={dailyAttendance[student.id]?.status === 'ABSENT_JUSTIFIED_PENDING'}
                          onChange={() => handleAttendanceChange(student.id, 'ABSENT_JUSTIFIED_PENDING')}
                        />
                        <span className="option-icon">
                          <i className="fas fa-clock"></i>
                        </span>
                        <span>Atraso</span>
                      </label>
                    </div>

                    <div className="student-actions">
                      <button 
                        onClick={() => openJustificationModal(student)}
                        className="btn-outline-info btn-sm"
                        title="Agregar justificación"
                      >
                        <i className="fas fa-comment-dots"></i>
                      </button>
                      
                      {dailyAttendance[student.id]?.justification && (
                        <span className="justification-indicator" title="Tiene justificación">
                          <i className="fas fa-paperclip"></i>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="save-attendance-section">
                <button 
                  onClick={saveAttendanceRecords}
                  className="btn-primary btn-large"
                  disabled={loading}
                >
                  <i className="fas fa-save"></i>
                  {loading ? 'Guardando...' : 'Guardar Registros de Asistencia'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vista de historial */}
      {showHistory && selectedCourse && (
        <div className="attendance-history">
          <div className="history-header">
            <h3>Historial de Asistencias</h3>
            
            {/* Filtros del historial */}
            <div className="history-filters">
              <div className="filter-group">
                <label>Desde:</label>
                <input
                  type="date"
                  value={historyFilters.start_date}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    start_date: e.target.value 
                  }))}
                />
              </div>

              <div className="filter-group">
                <label>Hasta:</label>
                <input
                  type="date"
                  value={historyFilters.end_date}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    end_date: e.target.value 
                  }))}
                />
              </div>

              <div className="filter-group">
                <label>Estudiante:</label>
                <select
                  value={historyFilters.student_id || ''}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    student_id: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                >
                  <option value="">Todos los estudiantes</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="stats-container">
              <div className="stat-card total-students">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h4>Total Estudiantes</h4>
                  <p className="stat-number">{stats.total_students}</p>
                </div>
              </div>

              <div className="stat-card present">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h4>Presentes</h4>
                  <p className="stat-number">{stats.present_count}</p>
                </div>
              </div>

              <div className="stat-card absent">
                <div className="stat-icon">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div className="stat-content">
                  <h4>Ausentes</h4>
                  <p className="stat-number">{stats.total_absent_count}</p>
                </div>
              </div>

              <div className="stat-card late">
                <div className="stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-content">
                  <h4>Injustificados</h4>
                  <p className="stat-number">{stats.absent_unjustified_count}</p>
                </div>
              </div>

              <div className="stat-card percentage">
                <div className="stat-icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div className="stat-content">
                  <h4>% Asistencia</h4>
                  <p className="stat-number">{stats.attendance_percentage}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de registros */}
          <div className="attendance-records-table">
            {attendanceRecords.length === 0 ? (
              <div className="no-records">
                <i className="fas fa-calendar-times"></i>
                <p>No hay registros de asistencia para los filtros seleccionados</p>
              </div>
            ) : (
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estudiante (ID - Nombre)</th>
                    <th>Estado</th>
                    <th>Justificación</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => (
                    <tr 
                      key={record.id} 
                      className="editable-row" 
                      onClick={() => openEditModal(record)}
                      title="Hacer clic para editar este registro"
                    >
                      <td>{attendanceService.formatDate(record.date)}</td>
                      <td>
                        <div className="student-info-cell">
                          <span className="student-id">ID: {record.student_external_id}</span>
                          <span className="student-name">
                            {record.student_name || 'Nombre no disponible'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${attendanceService.getStatusColor(record.status)}`}>
                          <i className={attendanceService.getStatusIcon(record.status)}></i>
                          {attendanceService.getStatusText(record.status)}
                        </span>
                      </td>
                      <td>
                        {record.justification_file_reference ? (
                          <span className="has-justification">
                            <i className="fas fa-paperclip"></i>
                            Archivo adjunto
                          </span>
                        ) : (
                          <span className="no-justification">Sin justificación</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal de justificación */}
      {showJustificationModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Agregar Justificación</h3>
              <button 
                onClick={() => setShowJustificationModal(false)}
                className="modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p><strong>Estudiante:</strong> {selectedStudent.name}</p>
              
              <div className="form-group">
                <label>Motivo de la falta:</label>
                <textarea
                  value={justificationText}
                  onChange={(e) => setJustificationText(e.target.value)}
                  placeholder="Describe el motivo de la falta..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Archivo de justificación (opcional):</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setJustificationFile(e.target.files?.[0] || null)}
                />
                <small>Formatos permitidos: PDF, DOC, DOCX, JPG, PNG</small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowJustificationModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={saveJustification}
                className="btn-primary"
              >
                <i className="fas fa-save"></i>
                Guardar Justificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de registro */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Estado de Asistencia</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p><strong>Estudiante ID:</strong> {editingRecord.student_external_id}</p>
              <p><strong>Fecha:</strong> {attendanceService.formatDate(editingRecord.date)}</p>
              <p><strong>Estado actual:</strong> {attendanceService.getStatusText(editingRecord.status)}</p>
              
              <div className="form-group">
                <label>Nuevo estado:</label>
                <div className="edit-attendance-options">
                  <button 
                    onClick={() => updateAttendanceRecord('PRESENT')}
                    className={`edit-option presente ${editingRecord.status === 'PRESENT' ? 'current' : ''}`}
                  >
                    <i className="fas fa-check-circle"></i>
                    Presente
                  </button>
                  
                  <button 
                    onClick={() => updateAttendanceRecord('ABSENT_UNJUSTIFIED')}
                    className={`edit-option ausente ${editingRecord.status === 'ABSENT_UNJUSTIFIED' ? 'current' : ''}`}
                  >
                    <i className="fas fa-times-circle"></i>
                    Ausente
                  </button>
                  
                  <button 
                    onClick={() => updateAttendanceRecord('ABSENT_JUSTIFIED_PENDING')}
                    className={`edit-option atraso ${editingRecord.status === 'ABSENT_JUSTIFIED_PENDING' ? 'current' : ''}`}
                  >
                    <i className="fas fa-clock"></i>
                    Justificado Pendiente
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarFaltas;