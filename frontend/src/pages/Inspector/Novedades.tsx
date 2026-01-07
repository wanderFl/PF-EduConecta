import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Novedades.css';

interface Course {
  id_curso: number;
  nombre: string;
  paralelo: string;
  nivel: string;
}

interface Student {
  id_estudiante: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  nombre: string;
  paralelo: string;
}

const Novedades: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourseParalelo, setSelectedCourseParalelo] = useState(''); // formato: "cursoId|paralelo"
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'LEVE',
    category: 'COMPORTAMIENTO',
    incident_date: new Date().toISOString().split('T')[0]
  });

  // Funciones de carga
  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/disciplinary-reports/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = useCallback(async () => {
    if (!selectedCourseParalelo) return;
    
    const [courseId, paralelo] = selectedCourseParalelo.split('|');
    
    try {
      setLoading(true);
      const response = await api.get('/disciplinary-reports/students', {
        params: {
          courseId,
          paralelo
        }
      });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Error al cargar los estudiantes');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseParalelo]);

  // Cargar cursos al montar
  useEffect(() => {
    loadCourses();
  }, []);

  // Cargar estudiantes cuando se selecciona curso y paralelo
  useEffect(() => {
    if (selectedCourseParalelo) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedCourseParalelo, loadStudents]);

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id_estudiante));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert('Debe seleccionar al menos un estudiante');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('El título y la descripción son obligatorios');
      return;
    }

    const [courseId, paralelo] = selectedCourseParalelo.split('|');

    try {
      setSubmitting(true);
      await api.post('/disciplinary-reports', {
        student_external_ids: selectedStudents,
        course_external_id: courseId,
        paralelo,
        ...formData
      });

      alert(`Novedad enviada exitosamente a ${selectedStudents.length} estudiante(s)`);
      
      // Resetear formulario
      setFormData({
        title: '',
        description: '',
        severity: 'LEVE',
        category: 'COMPORTAMIENTO',
        incident_date: new Date().toISOString().split('T')[0]
      });
      setSelectedStudents([]);
      setSelectedCourseParalelo('');
      setStudents([]);
    } catch (error: unknown) {
      console.error('Error submitting report:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Error al enviar la novedad');
    } finally {
      setSubmitting(false);
    }
  };

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
              Registro de Novedades
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#d7e3ff',
              marginTop: '2px'
            }}>
              Novedades disciplinarias
            </div>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/inspector/dashboard')}
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

      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {/* Sección de filtros */}
        <div className="filters-section">
          <h2>Seleccionar Estudiantes</h2>
          
          <div className="filters-grid">
            <div className="form-group">
              <label>Curso y Paralelo:</label>
              <select
                value={selectedCourseParalelo}
                onChange={(e) => setSelectedCourseParalelo(e.target.value)}
                disabled={loading}
              >
                <option value="">Seleccione un curso</option>
                {courses.map(course => (
                  <option 
                    key={`${course.id_curso}-${course.paralelo}`} 
                    value={`${course.id_curso}|${course.paralelo}`}
                  >
                    {course.nombre} - Paralelo {course.paralelo} ({course.nivel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <p className="loading-text">Cargando estudiantes...</p>}

          {students.length > 0 && (
            <div className="students-list">
              <div className="students-header">
                <h3>Estudiantes ({students.length})</h3>
                <button
                  type="button"
                  className="btn-select-all"
                  onClick={handleSelectAll}
                >
                  {selectedStudents.length === students.length
                    ? 'Deseleccionar Todos'
                    : 'Seleccionar Todos'}
                </button>
              </div>

              <div className="students-grid">
                {students.map(student => (
                  <div
                    key={student.id_estudiante}
                    className={`student-card ${
                      selectedStudents.includes(student.id_estudiante) ? 'selected' : ''
                    }`}
                    onClick={() => handleStudentToggle(student.id_estudiante)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id_estudiante)}
                      onChange={() => {}}
                    />
                    <div className="student-info">
                      <strong>{student.apellidos} {student.nombres}</strong>
                      <span className="student-cedula">CI: {student.cedula}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulario de novedad */}
        {selectedStudents.length > 0 && (
          <form onSubmit={handleSubmit} className="report-form">
            <h2>Detalles de la Novedad</h2>
            <p className="selected-count">
              {selectedStudents.length} estudiante(s) seleccionado(s)
            </p>

            <div className="form-group">
              <label>Título/Asunto: *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Comportamiento inadecuado en clase"
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción detallada: *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describa el incidente de manera detallada..."
                rows={6}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Severidad: *</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                >
                  <option value="LEVE">Leve</option>
                  <option value="MODERADA">Moderada</option>
                  <option value="GRAVE">Grave</option>
                </select>
              </div>

              <div className="form-group">
                <label>Categoría: *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="COMPORTAMIENTO">Comportamiento</option>
                  <option value="ACADEMICO">Académico</option>
                  <option value="ASISTENCIA">Asistencia</option>
                  <option value="UNIFORME">Uniforme</option>
                  <option value="OTROS">Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha del incidente: *</label>
                <input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar Novedad'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Novedades;
