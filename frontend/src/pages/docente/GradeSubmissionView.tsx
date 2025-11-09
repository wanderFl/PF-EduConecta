import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface SubmissionDetail {
  id: string;
  task_id: string;
  student_external_id: number;
  grade: number | null;
  feedback: string | null;
  file_reference: string | null;
  created_at: string;
  updated_at: string;
  student: {
    id: number;
    nombre_completo: string;
    curso_nombre?: string;
  };
  task: {
    id: string;
    title: string;
    instructions: string | null;
    due_date: string;
    max_points: number | null;
    file_reference: string | null;
  };
}

const GradeSubmissionView: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Form state
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const loadSubmissionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/protected/docente/submissions/${submissionId}`);
      
      if (response.data.success) {
        const submissionData = response.data.submission;
        setSubmission(submissionData);
        setGrade(submissionData.grade?.toString() || '');
        setFeedback(submissionData.feedback || '');
      } else {
        setError('Error al cargar los detalles de la entrega');
      }
    } catch (err) {
      console.error('Error loading submission details:', err);
      setError('Error al cargar los detalles de la entrega');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (submissionId) {
      loadSubmissionDetails();
    }
  }, [submissionId, loadSubmissionDetails]);

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submission) return;
    
    // Validaciones
    if (grade && submission.task.max_points) {
      const numericGrade = parseFloat(grade);
      if (numericGrade > submission.task.max_points) {
        setError(`La calificación no puede ser mayor a ${submission.task.max_points} puntos`);
        return;
      }
    }

    try {
      setSaving(true);
      setError('');
      
      const payload = {
        grade: grade ? parseFloat(grade) : null,
        feedback: feedback.trim() || null
      };

      const response = await api.put(`/protected/docente/submissions/${submissionId}/grade`, payload);
      
      if (response.data.success) {
        setSuccess('Calificación guardada correctamente');
        // Reload submission data to reflect changes
        await loadSubmissionDetails();
      } else {
        setError('Error al guardar la calificación');
      }
    } catch (err) {
      console.error('Error saving grade:', err);
      setError('Error al guardar la calificación');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileUrl = (fileReference: string, type: 'task' | 'submission') => {
    const cleanPath = fileReference.replace(`uploads/${type}s/`, '');
    return `http://localhost:3000/api/protected/files/download/${type}s/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Cargando detalles de la entrega...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg">No se pudo cargar la entrega</div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Calificar Entrega
              </h1>
              <p className="text-gray-600">
                {submission.student.nombre_completo} - {submission.task.title}
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              ← Volver
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Información de la Tarea
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Título:</p>
                    <p className="text-gray-800">{submission.task.title}</p>
                  </div>
                  
                  {submission.task.instructions && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Instrucciones:</p>
                      <p className="text-gray-800 bg-white p-3 rounded border text-sm">
                        {submission.task.instructions}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha límite:</p>
                    <p className="text-gray-800">{formatDate(submission.task.due_date)}</p>
                  </div>
                  
                  {submission.task.max_points && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Puntuación máxima:</p>
                      <p className="text-gray-800">{submission.task.max_points} puntos</p>
                    </div>
                  )}

                  {submission.task.file_reference && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Archivo de la tarea:</p>
                      <a
                        href={getFileUrl(submission.task.file_reference, 'task')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        📎 Descargar archivo de tarea
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Submission */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Entrega del Estudiante
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estudiante:</p>
                    <p className="text-gray-800">{submission.student.nombre_completo}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de entrega:</p>
                    <p className="text-gray-800">{formatDate(submission.created_at)}</p>
                  </div>

                  {submission.file_reference && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Archivo entregado:</p>
                      <a
                        href={getFileUrl(submission.file_reference, 'submission')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        📎 Descargar entrega del estudiante
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grading Form */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Calificación y Retroalimentación
              </h2>
              
              <form onSubmit={handleSaveGrade} className="space-y-4">
                {/* Grade Input */}
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Calificación {submission.task.max_points && `(máximo ${submission.task.max_points} puntos)`}
                  </label>
                  <input
                    type="number"
                    id="grade"
                    min="0"
                    max={submission.task.max_points || undefined}
                    step="0.1"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingrese la calificación"
                  />
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Retroalimentación
                  </label>
                  <textarea
                    id="feedback"
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Escriba comentarios sobre la tarea del estudiante..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Guardando...' : 'Guardar Calificación'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setGrade(submission.grade?.toString() || '');
                      setFeedback(submission.feedback || '');
                      setError('');
                      setSuccess('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Restablecer
                  </button>
                </div>
              </form>
              
              {/* Current Grade Display */}
              {submission.grade !== null && (
                <div className="mt-6 p-4 bg-white rounded border">
                  <h3 className="font-medium text-gray-800 mb-2">Calificación actual:</h3>
                  <p className="text-lg font-bold text-blue-600">
                    {submission.grade}{submission.task.max_points && `/${submission.task.max_points}`} puntos
                  </p>
                  {submission.feedback && (
                    <>
                      <p className="font-medium text-gray-800 mt-3 mb-1">Retroalimentación actual:</p>
                      <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">
                        {submission.feedback}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Última actualización: {formatDate(submission.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmissionView;