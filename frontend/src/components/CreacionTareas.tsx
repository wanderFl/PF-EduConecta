import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/tasks';
import CourseSelector from './CourseSelector';
import './CreacionTareas.css';

interface FormData {
  nombre: string;
  instrucciones: string;
  puntuacion: string;
  fechaVencimiento: string;
  cursoId: string;
  file: File | null;
}

const CreacionTareas: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    instrucciones: '',
    puntuacion: '',
    fechaVencimiento: '',
    cursoId: '',
    file: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validaciones del formulario
  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) {
      return 'El nombre de la tarea es requerido';
    }
    
    if (!formData.cursoId) {
      return 'Debe seleccionar un curso';
    }
    
    if (!formData.fechaVencimiento) {
      return 'La fecha de vencimiento es requerida';
    }
    
    // Validar que la fecha no sea en el pasado
    const fechaVencimiento = new Date(formData.fechaVencimiento);
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0); // Comparar solo fechas, no horas
    
    if (fechaVencimiento < ahora) {
      return 'La fecha de vencimiento no puede ser en el pasado';
    }
    
    // Validar puntuación si se proporciona
    if (formData.puntuacion) {
      const puntuacion = parseFloat(formData.puntuacion);
      if (isNaN(puntuacion) || puntuacion < 0 || puntuacion > 10) {
        return 'La puntuación debe estar entre 0 y 10';
      }
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      file
    }));
  };

  const handleCourseChange = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      cursoId: courseId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await taskService.createTask({
        nombre: formData.nombre,
        instrucciones: formData.instrucciones,
        puntuacion: formData.puntuacion ? parseFloat(formData.puntuacion) : 0,
        fechaVencimiento: formData.fechaVencimiento,
        cursoId: formData.cursoId,
        file: formData.file
      });

      setSuccess(true);
      
      // Mostrar mensaje de éxito y redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/docente/dashboard');
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear la tarea';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/docente/dashboard');
  };

  if (success) {
    return (
      <div className="creacion-tareas-container">
        <div className="creacion-tareas-card success-card">
          <div className="success-content">
            <i className="fas fa-check-circle success-icon"></i>
            <h2>¡Tarea creada exitosamente!</h2>
            <p>La tarea ha sido guardada correctamente y asignada al curso seleccionado.</p>
            <div className="loading-spinner small"></div>
            <p className="redirect-message">Redirigiendo al dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creacion-tareas-container">
      <div className="creacion-tareas-card">
        <div className="card-header">
          <h1>
            <i className="fas fa-plus-circle"></i>
            Crear Nueva Tarea
          </h1>
          <p>Complete la información para crear una nueva tarea para sus estudiantes</p>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {/* Selector de curso - Campo principal requerido */}
          <CourseSelector
            selectedCourse={formData.cursoId}
            onCourseChange={handleCourseChange}
            required={true}
            placeholder="Seleccionar curso donde asignar la tarea"
            className="course-field"
          />

          {/* Nombre de la tarea */}
          <div className="form-group">
            <label htmlFor="nombre">
              Nombre de la tarea <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Ensayo sobre la independencia del Ecuador"
              required
              maxLength={200}
              className={formData.nombre ? 'has-value' : ''}
            />
            <small className="field-help">
              Proporcione un nombre claro y descriptivo para la tarea
            </small>
          </div>

          {/* Instrucciones */}
          <div className="form-group">
            <label htmlFor="instrucciones">Instrucciones</label>
            <textarea
              id="instrucciones"
              name="instrucciones"
              value={formData.instrucciones}
              onChange={handleInputChange}
              placeholder="Describa detalladamente lo que deben hacer los estudiantes..."
              rows={6}
              maxLength={1000}
              className={formData.instrucciones ? 'has-value' : ''}
            />
            <small className="field-help">
              Proporcione instrucciones claras sobre qué deben hacer los estudiantes
            </small>
          </div>

          {/* Fecha de vencimiento */}
          <div className="form-group">
            <label htmlFor="fechaVencimiento">
              Fecha de vencimiento <span className="required">*</span>
            </label>
            <input
              type="date"
              id="fechaVencimiento"
              name="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className={formData.fechaVencimiento ? 'has-value' : ''}
            />
            <small className="field-help">
              La fecha límite para que los estudiantes entreguen la tarea
            </small>
          </div>

          {/* Puntuación máxima */}
          <div className="form-group">
            <label htmlFor="puntuacion">Puntuación máxima</label>
            <input
              type="number"
              id="puntuacion"
              name="puntuacion"
              value={formData.puntuacion}
              onChange={handleInputChange}
              placeholder="10"
              min="0"
              max="10"
              step="0.1"
              className={formData.puntuacion ? 'has-value' : ''}
            />
            <small className="field-help">
              Puntos máximos que puede obtener el estudiante (0-10). Deje vacío si no desea calificar
            </small>
          </div>

          {/* Archivo adjunto */}
          <div className="form-group">
            <label htmlFor="file">Archivo adjunto</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="file-input"
              />
              <label htmlFor="file" className="file-input-label">
                <i className="fas fa-paperclip"></i>
                {formData.file ? formData.file.name : 'Seleccionar archivo (opcional)'}
              </label>
            </div>
            <small className="field-help">
              Archivos permitidos: PDF, Word, imágenes, texto. Máximo 10MB
            </small>
            {formData.file && (
              <div className="file-info">
                <i className="fas fa-file-alt"></i>
                <span>{formData.file.name}</span>
                <span className="file-size">({Math.round(formData.file.size / 1024)} KB)</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                  className="remove-file"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Cancelar
            </button>
            
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner inline"></div>
                  Creando tarea...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Crear Tarea
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreacionTareas;
